import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { buildWeighInDetailData } from "@/lib/weigh-in/build-detail-data";
import { WeighInDetailShell } from "@/components/weigh-in/weigh-in-detail-shell";

export const dynamic = "force-dynamic";

export default async function WeighInDetailPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const data = await buildWeighInDetailData(userId);

  return <WeighInDetailShell data={data} />;
}
