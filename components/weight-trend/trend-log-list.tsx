import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import type { DailyPoint } from "@/utils/analytics";
import { formatDisplayDate, formatTrendDelta } from "@/utils/analytics";

type TrendLogListProps = {
  points: DailyPoint[];
};

function TrendDeltaBadge({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.005) {
    return (
      <span className="flex items-center gap-1 text-sm text-violet-600">
        <ArrowRight className="h-4 w-4" />
        No Change
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="flex items-center gap-1 text-sm text-violet-600">
        <TrendingUp className="h-4 w-4" />
        {`+${delta.toFixed(1)} kg`}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm text-violet-600">
      <TrendingDown className="h-4 w-4" />
      {`${delta.toFixed(1)} kg`}
    </span>
  );
}

export function TrendLogList({ points }: TrendLogListProps) {
  const rows = [...points].reverse();

  return (
    <ul className="divide-y divide-neutral-100 bg-white">
      {rows.map((point) => (
        <li
          key={point.date.toISOString()}
          className="flex items-center justify-between px-4 py-4"
        >
          <div>
            <p className="text-lg font-bold text-neutral-900">
              {point.trendRounded.toFixed(1)} kg
            </p>
            <p className="text-sm text-neutral-500">
              {formatDisplayDate(point.date)}
            </p>
          </div>
          <TrendDeltaBadge delta={point.trendDelta} />
        </li>
      ))}
    </ul>
  );
}
