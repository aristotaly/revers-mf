"use client";

import { useMemo, useState } from "react";
import type { DailyPoint, TimeWindow } from "@/utils/analytics";
import { computeKpis, computeTrendInsights, sliceByWindow } from "@/utils/analytics";
import { KpiSummary } from "./kpi-summary";
import { WeightChart } from "./weight-chart";
import { PeriodFilter } from "./period-filter";
import { TutorialBanner } from "./tutorial-banner";
import { TrendInsightsPanel } from "./trend-insights-panel";
import { DailyBreakdownTable } from "./daily-breakdown-table";

type DashboardClientProps = {
  allPoints: DailyPoint[];
  loggedEntries: { date: Date; weight: number }[];
  fixedDate?: Date;
};

export function DashboardClient({
  allPoints,
  loggedEntries,
  fixedDate,
}: DashboardClientProps) {
  const [window, setWindow] = useState<TimeWindow>("1M");
  const today = fixedDate ?? new Date();

  const kpis = useMemo(
    () => computeKpis(allPoints, loggedEntries, window, today),
    [allPoints, loggedEntries, window, today],
  );

  const windowPoints = useMemo(
    () => sliceByWindow(allPoints, window, today),
    [allPoints, window, today],
  );

  const trendInsights = useMemo(
    () => computeTrendInsights(allPoints, today),
    [allPoints, today],
  );

  return (
    <>
      <KpiSummary
        average={kpis.average}
        difference={kpis.difference}
        dateRangeLabel={kpis.dateRangeLabel}
      />
      <WeightChart points={windowPoints} />
      <PeriodFilter active={window} onChange={setWindow} />
      <TrendInsightsPanel insights={trendInsights} />
      <TutorialBanner />
      <DailyBreakdownTable points={windowPoints} />
    </>
  );
}
