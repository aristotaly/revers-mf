import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { resolveView } from "@/lib/viewer";
import { buildDashboardData } from "@/lib/dashboard/build-dashboard-data";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ViewerPicker } from "@/components/dashboard/viewer-picker";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const view = await resolveView(me);

  // Viewer with no (valid) selection and multiple targets — show the picker.
  if ("needsPicker" in view) {
    return <ViewerPicker session={view.session} targets={view.targets} />;
  }

  const data = await buildDashboardData(view.viewing.id);

  return (
    <DashboardShell
      data={data}
      currentUser={view.session}
      viewing={view.viewing}
      isViewer={view.isViewer}
      otherTargets={view.otherTargets}
    />
  );
}
