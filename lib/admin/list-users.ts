import { prisma } from "@/lib/prisma";
import type { AdminUserSummary } from "@/lib/actions/admin";
import type { CurrentUser } from "@/lib/session";

/** Server-side helper (not a Server Action) — safe to call from RSC pages. */
export async function listUsersForAdmin(
  _admin: CurrentUser,
): Promise<AdminUserSummary[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { weightEntries: true } },
      viewerAccess: {
        select: {
          target: {
            select: { id: true, username: true, name: true },
          },
        },
        orderBy: { target: { name: "asc" } },
      },
    },
  });

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role === "admin" ? "admin" : u.role === "viewer" ? "viewer" : "user",
    entryCount: u._count.weightEntries,
    createdAt: u.createdAt.toISOString(),
    viewerTargets: u.viewerAccess.map((v) => v.target),
  }));
}
