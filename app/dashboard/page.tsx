import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { buildDashboardData } from "@/lib/dashboard/build-dashboard-data";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const data = await buildDashboardData(me.id);

  return <DashboardShell data={data} currentUser={me} />;
}
