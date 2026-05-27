import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { CurrentUser, Role } from "@/lib/session";

const VIEWING_COOKIE = "viewing-target";

export type ViewerTarget = {
  id: string;
  username: string;
  name: string;
  role: Role;
};

/**
 * Effective user for a read-only screen.
 *
 *   - For admin/user accounts the effective user IS the signed-in user.
 *   - For viewer accounts the effective user is whichever target the viewer
 *     has currently selected (via the `viewing-target` cookie), provided they
 *     still have access to it. If there is no valid selection, returns null
 *     and the calling page should redirect to /dashboard so the picker shows.
 */
export type ResolvedView = {
  /** Always the actual logged-in user (the viewer themselves). */
  session: CurrentUser;
  /** The user whose data we should display. May equal session for non-viewers. */
  viewing: ViewerTarget;
  /** Convenience flag for templates. */
  isViewer: boolean;
  /** Other targets a viewer can switch to (always [] for non-viewers). */
  otherTargets: ViewerTarget[];
};

function toTarget(u: {
  id: string;
  username: string;
  name: string;
  role: string;
}): ViewerTarget {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role === "admin" ? "admin" : u.role === "viewer" ? "viewer" : "user",
  };
}

/** All users a viewer has access to (sorted by display name). */
export async function getViewerTargets(viewerId: string): Promise<ViewerTarget[]> {
  const rows = await prisma.viewerAccess.findMany({
    where: { viewerId },
    include: {
      target: {
        select: { id: true, username: true, name: true, role: true },
      },
    },
    orderBy: { target: { name: "asc" } },
  });
  return rows.map((r) => toTarget(r.target));
}

/** Read the currently-selected target id from the cookie. */
export async function getSelectedTargetId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(VIEWING_COOKIE)?.value ?? null;
}

/**
 * Resolve the read-side view for a signed-in user.
 *
 * For viewers we look up their target list; if no cookie is set but they only
 * have one target we auto-select it. If they have multiple targets and no
 * (valid) selection, `viewing` will be null so the caller can render the
 * picker UI.
 */
export async function resolveView(
  session: CurrentUser,
): Promise<ResolvedView | { session: CurrentUser; needsPicker: true; targets: ViewerTarget[] }> {
  if (session.role !== "viewer") {
    return {
      session,
      viewing: {
        id: session.id,
        username: session.username,
        name: session.name,
        role: session.role,
      },
      isViewer: false,
      otherTargets: [],
    };
  }

  const targets = await getViewerTargets(session.id);
  if (targets.length === 0) {
    // Account misconfigured — admin forgot to assign anyone. Show the picker
    // (which will say "no users assigned").
    return { session, needsPicker: true, targets: [] };
  }

  const selected = await getSelectedTargetId();
  const matched = selected ? targets.find((t) => t.id === selected) : undefined;

  // Single-target viewers don't need to pick — auto-select.
  const viewing =
    matched ?? (targets.length === 1 ? targets[0] : undefined);

  if (!viewing) {
    return { session, needsPicker: true, targets };
  }

  return {
    session,
    viewing,
    isViewer: true,
    otherTargets: targets.filter((t) => t.id !== viewing.id),
  };
}

export type { Role } from "@/lib/session";
export const VIEWING_TARGET_COOKIE = VIEWING_COOKIE;

/**
 * Read-side page guard. Returns the user the page should query data for, plus
 * the viewer context for the header. If the caller is a viewer with multiple
 * targets and no selection, returns `null` so the page can redirect to
 * `/dashboard` (which renders the picker).
 */
export type PageView = {
  session: CurrentUser;
  viewing: ViewerTarget;
  isViewer: boolean;
  otherTargets: ViewerTarget[];
};

export async function resolvePageView(
  session: CurrentUser,
): Promise<PageView | null> {
  const view = await resolveView(session);
  if ("needsPicker" in view) return null;
  return {
    session: view.session,
    viewing: view.viewing,
    isViewer: view.isViewer,
    otherTargets: view.otherTargets,
  };
}
