"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import type { TrendMiniPoint } from "@/lib/dashboard/build-dashboard-data";

type WeightTrendMiniCardProps = {
  points: TrendMiniPoint[];
  latestTrend: number | null;
};

export function WeightTrendMiniCard({
  points,
  latestTrend,
}: WeightTrendMiniCardProps) {
  const chartData = points.map((p) => ({ ...p, label: p.date.slice(5) }));
  const values = points.map((p) => p.trend);
  const min = values.length ? Math.min(...values) - 0.5 : 90;
  const max = values.length ? Math.max(...values) + 0.5 : 100;

  return (
    <Link
      href="/weight-trend"
      prefetch={false}
      className="flex min-h-[168px] flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 transition-shadow hover:shadow-md"
      data-testid="weight-trend-mini-card"
    >
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-neutral-900">Weight Trend</h3>
        <p className="text-xs text-neutral-500">Last 7 Days</p>
      </div>
      <div className="h-[72px] w-full flex-1">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <YAxis domain={[min, max]} hide />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }}
                activeDot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            Log weights to see trend
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-800">
          {latestTrend != null ? `${latestTrend.toFixed(1)} kg` : "—"}
        </span>
        <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
      </div>
    </Link>
  );
}
