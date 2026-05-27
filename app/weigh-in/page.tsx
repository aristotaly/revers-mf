import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { resolvePageView } from "@/lib/viewer";
import { buildWeighInDetailData } from "@/lib/weigh-in/build-detail-data";
import { WeighInDetailShell } from "@/components/weigh-in/weigh-in-detail-shell";

export const dynamic = "force-dynamic";

export default async function WeighInDetailPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const view = await resolvePageView(me);
  if (!view) redirect("/dashboard");

  const data = await buildWeighInDetailData(view.viewing.id);

  return (
    <WeighInDetailShell
      data={data}
      isViewer={view.isViewer}
      viewing={view.viewing}
      otherTargets={view.otherTargets}
    />
  );
}
