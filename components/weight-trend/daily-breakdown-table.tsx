import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { DailyPoint } from "@/utils/analytics";
import { formatDisplayDate, toDateKey } from "@/utils/analytics";

type DailyBreakdownTableProps = {
  points: DailyPoint[];
};

function DeltaIcon({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.005) {
    return <Minus className="h-4 w-4 text-violet-600" />;
  }
  if (delta > 0) {
    return <TrendingUp className="h-4 w-4 text-violet-600" />;
  }
  return <TrendingDown className="h-4 w-4 text-violet-600" />;
}

export function DailyBreakdownTable({ points }: DailyBreakdownTableProps) {
  const rows = [...points].reverse();

  return (
    <div className="px-4 pb-8">
      <h2 className="mb-3 text-base font-semibold text-neutral-900">
        Daily Breakdown &amp; Logs
      </h2>
      <div className="overflow-hidden rounded-xl bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs text-neutral-500">
              <th className="py-2 pr-2 font-medium">Date</th>
              <th className="py-2 pr-2 font-medium">Scale (kg)</th>
              <th className="py-2 pr-2 font-medium">Trend (Rounded kg)</th>
              <th className="py-2 font-medium">Trend Delta (Unrounded kg)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((point) => {
              const key = toDateKey(point.date);
              const deltaLabel =
                point.trendDelta > 0
                  ? `+${point.trendDelta.toFixed(2)}`
                  : point.trendDelta.toFixed(2);
              return (
                <tr
                  key={key}
                  className="border-b border-neutral-50"
                  data-testid={`row-${key}`}
                >
                  <td className="py-3 pr-2 text-neutral-800">
                    {formatDisplayDate(point.date)}
                  </td>
                  <td
                    className="py-3 pr-2 text-neutral-800"
                    data-testid={`scale-${key}`}
                  >
                    {point.scaleIsInterpolated
                      ? point.scale.toFixed(1)
                      : point.scale.toFixed(1)}
                  </td>
                  <td
                    className="py-3 pr-2 text-neutral-800"
                    data-testid={`trend-${key}`}
                  >
                    {point.trendRounded.toFixed(1)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1 text-violet-600">
                      <DeltaIcon delta={point.trendDelta} />
                      <span data-testid={`delta-${key}`}>{deltaLabel}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
