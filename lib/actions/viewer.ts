"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { VIEWING_TARGET_COOKIE } from "@/lib/viewer";

/**
 * Choose which target user a viewer wants to look at. Stores the selection in
 * a cookie so every subsequent server-render reads the right data. We
 * validate the viewer truly has access before persisting the cookie.
 *
 * Non-viewer roles get a no-op so this can be called from a generic header
 * switcher without worrying about role checks.
 */
export async function selectViewingTargetAction(
  targetId: string,
  redirectTo: string = "/dashboard",
): Promise<{ ok: boolean; error?: string }> {
  let me;
  try {
    me = await requireUser();
  } catch {
    return { ok: false, error: "Unauthorized." };
  }

  if (me.role !== "viewer") {
    // Pass-through: nothing to do, but avoid leaking that info.
    return { ok: true };
  }

  const access = await prisma.viewerAccess.findUnique({
    where: { viewerId_targetId: { viewerId: me.id, targetId } },
  });
  if (!access) {
    return { ok: false, error: "You do not have access to that user." };
  }

  const cookieStore = await cookies();
  cookieStore.set(VIEWING_TARGET_COOKIE, targetId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  // Refresh every screen so they re-read the cookie.
  revalidatePath("/", "layout");

  if (redirectTo) redirect(redirectTo);
  return { ok: true };
}

/** Clears the viewer's selection so they go back to the picker. */
export async function clearViewingTargetAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(VIEWING_TARGET_COOKIE);
  revalidatePath("/", "layout");
}
