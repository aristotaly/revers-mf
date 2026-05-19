import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listUsersForAdmin } from "@/lib/admin/list-users";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/weight-trend");

  const users = await listUsersForAdmin(me);

  return <AdminShell currentUserId={me.id} users={users} />;
}
