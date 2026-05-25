"use client";

import type { TrendInsights } from "@/utils/analytics";

type TrendInsightsPanelProps = {
  insights: TrendInsights;
};

function formatSignedKg(value: number, suffix = " kg"): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}${suffix}`;
}

function formatSignedKcal(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value} kcal per day`;
}

type InsightRowProps = {
  title: string;
  value: string;
  description: string;
  testId?: string;
};

function InsightRow({ title, value, description, testId }: InsightRowProps) {
  return (
    <div
      className="border-b border-neutral-100 px-4 py-4 last:border-b-0"
      data-testid={testId}
    >
      <p className="text-sm font-semibold text-neutral-900">{title}</p>
      <p className="mt-1 text-lg font-bold text-violet-700">{value}</p>
      <p className="mt-2 text-sm leading-snug text-neutral-600">{description}</p>
    </div>
  );
}

export function TrendInsightsPanel({ insights }: TrendInsightsPanelProps) {
  const energyLabel =
    insights.energyBalanceKcalPerDay != null &&
    insights.energyBalanceKcalPerDay < 0
      ? "Energy Deficit"
      : "Energy Surplus";

  return (
    <section className="px-4 pb-2" data-testid="trend-insights">
      <h2 className="mb-3 text-base font-semibold text-neutral-900">
        Insights &amp; Data
      </h2>

      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-neutral-100">
        <div className="border-b border-neutral-100 px-4 py-3">
          <p className="text-sm font-semibold text-neutral-900">Weight Changes</p>
          <div
            className="mt-3 grid grid-cols-5 gap-2 text-center"
            data-testid="weight-changes-grid"
          >
            {insights.weightChanges.map((row) => (
              <div key={row.label}>
                <p className="text-xs text-neutral-500">{row.label}</p>
                <p
                  className="mt-1 text-sm font-semibold text-violet-700"
                  data-testid={`weight-change-${row.days}d`}
                >
                  {formatSignedKg(row.changeKg)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <InsightRow
          title="Current Weight (Trend Weight)"
          value={`${insights.currentTrendKg.toFixed(1)} kg`}
          description="Your weight trend is an estimate of your true weight after smoothing out day-to-day fluctuations."
          testId="insight-current-trend"
        />

        {insights.hasRateMetrics && insights.weeklyChangeKg != null && (
          <>
            <InsightRow
              title="Weekly Weight Change"
              value={`${formatSignedKg(insights.weeklyChangeKg, " kg per week")}`}
              description="This is your typical weekly rate of weight change over the past three weeks."
              testId="insight-weekly-change"
            />

            {insights.energyBalanceKcalPerDay != null && (
              <InsightRow
                title={energyLabel}
                value={formatSignedKcal(insights.energyBalanceKcalPerDay)}
                description="This is an estimate of your average daily calorie balance implied by your rate of weight change over the past three weeks (from trend weight, not scale noise)."
                testId="insight-energy-balance"
              />
            )}

            {insights.projection30Kg != null && (
              <InsightRow
                title="30 Day Projection"
                value={`${insights.projection30Kg.toFixed(1)} kg`}
                description="This is your projected weight in 30 days if your current rate of weight change continues."
                testId="insight-projection-30"
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
