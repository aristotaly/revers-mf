"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters.")
  .max(32, "Username must be 32 characters or fewer.")
  .regex(
    /^[a-z0-9._-]+$/,
    "Username may only contain lowercase letters, digits, dots, dashes, and underscores.",
  );

const passwordSchema = z
  .string()
  .min(4, "Password must be at least 4 characters.")
  .max(128, "Password must be 128 characters or fewer.");

const nameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required.")
  .max(80, "Display name must be 80 characters or fewer.");

const writableRoleSchema = z.enum(["admin", "user"]);

export type AdminUserRole = "admin" | "user" | "viewer";

export type AdminUserSummary = {
  id: string;
  username: string;
  name: string;
  role: AdminUserRole;
  entryCount: number;
  createdAt: string;
  /** For viewer accounts only — the users they can see. */
  viewerTargets: { id: string; username: string; name: string }[];
};

export type AdminActionResult = {
  ok: boolean;
  error?: string;
};

/** Lists every user with their weight-entry count. Admin only. */
export async function listUsersAction(): Promise<AdminUserSummary[]> {
  const admin = await requireAdmin();
  const { listUsersForAdmin } = await import("@/lib/admin/list-users");
  return listUsersForAdmin(admin);
}

/**
 * Create a new user from the admin modal.
 *
 *   - role="user"   → regular tracker account (default).
 *   - role="viewer" → read-only account that can browse the data of one or
 *     more *target* users supplied via `targetUserIds`. Viewer accounts
 *     never get promoted to admin from this dialog; admin/role-swapping
 *     happens later via the user-list shield button (and that path
 *     refuses to touch viewer accounts).
 */
export async function createUserAction(
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Forbidden." };
  }

  const rawRole = String(formData.get("role") ?? "user");
  const createRole = z.enum(["user", "viewer"]).safeParse(rawRole);
  if (!createRole.success) {
    return { ok: false, error: "Invalid role." };
  }

  const parsed = z
    .object({
      username: usernameSchema,
      name: nameSchema,
      password: passwordSchema,
    })
    .safeParse({
      username: formData.get("username"),
      name: formData.get("name"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  // Viewer accounts must be linked to at least one target user up-front so
  // they have something to look at on first login.
  let targetUserIds: string[] = [];
  if (createRole.data === "viewer") {
    targetUserIds = formData
      .getAll("targetUserIds")
      .map((v) => String(v))
      .filter(Boolean);
    if (targetUserIds.length === 0) {
      return {
        ok: false,
        error: "Pick at least one user the viewer is allowed to see.",
      };
    }

    const found = await prisma.user.findMany({
      where: { id: { in: targetUserIds } },
      select: { id: true, role: true },
    });
    if (found.length !== targetUserIds.length) {
      return { ok: false, error: "One or more target users no longer exist." };
    }
    if (found.some((u) => u.role === "viewer")) {
      return { ok: false, error: "Viewers cannot view other viewers." };
    }
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (existing) {
    return { ok: false, error: "Username is already taken." };
  }

  const passcodeHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      username: parsed.data.username,
      name: parsed.data.name,
      role: createRole.data,
      passcodeHash,
      ...(createRole.data === "viewer" && targetUserIds.length > 0
        ? {
            viewerAccess: {
              create: targetUserIds.map((targetId) => ({ targetId })),
            },
          }
        : {}),
    },
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteUserAction(
  userId: string,
): Promise<AdminActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Forbidden." };
  }

  if (userId === admin.id) {
    return { ok: false, error: "You can't delete your own account." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found." };

  if (target.role === "admin") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return { ok: false, error: "Can't delete the last admin." };
    }
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
  return { ok: true };
}

export async function setUserRoleAction(
  userId: string,
  role: "admin" | "user",
): Promise<AdminActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Forbidden." };
  }

  const parsed = writableRoleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: "Invalid role." };

  if (userId === admin.id && role !== "admin") {
    return { ok: false, error: "You can't demote yourself." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found." };

  if (target.role === "viewer") {
    return {
      ok: false,
      error:
        "Viewer accounts can't be promoted. Delete and recreate to change the role.",
    };
  }

  if (target.role === "admin" && role === "user") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return { ok: false, error: "Can't demote the last admin." };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data },
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function setViewerTargetsAction(
  viewerId: string,
  targetUserIds: string[],
): Promise<AdminActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Forbidden." };
  }

  const viewer = await prisma.user.findUnique({ where: { id: viewerId } });
  if (!viewer) return { ok: false, error: "Viewer not found." };
  if (viewer.role !== "viewer") {
    return { ok: false, error: "That account is not a viewer." };
  }

  const ids = Array.from(new Set(targetUserIds.filter(Boolean)));
  if (ids.length === 0) {
    return {
      ok: false,
      error: "A viewer must have at least one user assigned.",
    };
  }
  if (ids.includes(viewerId)) {
    return { ok: false, error: "A viewer can't be assigned to themselves." };
  }

  const found = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, role: true },
  });
  if (found.length !== ids.length) {
    return { ok: false, error: "One or more target users no longer exist." };
  }
  if (found.some((u) => u.role === "viewer")) {
    return { ok: false, error: "Viewers cannot view other viewers." };
  }

  await prisma.$transaction([
    prisma.viewerAccess.deleteMany({ where: { viewerId } }),
    prisma.viewerAccess.createMany({
      data: ids.map((targetId) => ({ viewerId, targetId })),
    }),
  ]);

  revalidatePath("/admin");
  return { ok: true };
}

export type AdminTargetCandidate = {
  id: string;
  username: string;
  name: string;
  role: "admin" | "user";
};

/** Lists every non-viewer user — candidates a viewer account can be linked to. */
export async function listViewerTargetCandidatesAction(): Promise<AdminTargetCandidate[]> {
  await requireAdmin();
  const users = await prisma.user.findMany({
    where: { role: { in: ["admin", "user"] } },
    orderBy: [{ name: "asc" }, { username: "asc" }],
    select: { id: true, username: true, name: true, role: true },
  });
  return users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role === "admin" ? "admin" : "user",
  }));
}

export async function setUserPasswordAction(
  userId: string,
  newPassword: string,
): Promise<AdminActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Forbidden." };
  }

  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found." };

  const passcodeHash = await bcrypt.hash(parsed.data, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passcodeHash },
  });

  revalidatePath("/admin");
  return { ok: true };
}
