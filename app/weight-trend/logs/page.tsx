import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { resolvePageView } from "@/lib/viewer";
import { buildDailySeries } from "@/utils/analytics";
import { AppHeader } from "@/components/layout/app-header";
import { TrendLogList } from "@/components/weight-trend/trend-log-list";
import { ViewerBanner } from "@/components/viewer/viewer-banner";

export default async function WeightTrendLogsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const view = await resolvePageView(me);
  if (!view) redirect("/dashboard");

  const entries = await prisma.weightEntry.findMany({
    where: { userId: view.viewing.id },
    orderBy: { date: "asc" },
  });

  const points = buildDailySeries(
    entries.map((e) => ({ date: e.date, weight: e.weight })),
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader title="Weight Trend" backHref="/dashboard" />
      {view.isViewer && (
        <ViewerBanner
          viewing={view.viewing}
          otherTargets={view.otherTargets}
          redirectTo="/weight-trend/logs"
        />
      )}
      <TrendLogList points={points} />
      <div className="px-4 pb-8">
        <Link href="/weight-trend" className="text-sm text-violet-700 underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
