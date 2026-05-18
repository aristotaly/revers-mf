import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { buildDailySeries } from "@/utils/analytics";
import { AppHeader } from "@/components/layout/app-header";
import { TrendLogList } from "@/components/weight-trend/trend-log-list";

export default async function WeightTrendLogsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const entries = await prisma.weightEntry.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });

  const points = buildDailySeries(
    entries.map((e) => ({ date: e.date, weight: e.weight })),
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader title="Weight Trend" backHref="/weight-trend" />
      <TrendLogList points={points} />
      <div className="px-4 pb-8">
        <Link href="/weight-trend" className="text-sm text-violet-700 underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
