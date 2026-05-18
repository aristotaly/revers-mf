"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint } from "@/utils/analytics";
import { getChartDomain, toDateKey } from "@/utils/analytics";

type WeightChartProps = {
  points: DailyPoint[];
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-lg">
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className="flex items-center gap-2 text-sm"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-neutral-600">
            {entry.dataKey === "scale" ? "Scale" : "Trend"}:
          </span>
          <span className="font-medium">{entry.value.toFixed(3)} kg</span>
        </div>
      ))}
    </div>
  );
}

export function WeightChart({ points }: WeightChartProps) {
  const data = points.map((p) => ({
    date: toDateKey(p.date),
    label: p.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    scale: p.scale,
    trend: p.trend,
  }));

  const domain = getChartDomain(points);

  return (
    <div
      className="h-56 w-full px-2"
      data-testid="weight-chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e5e5"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#737373" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            orientation="right"
            domain={[domain.min, domain.max]}
            ticks={domain.ticks}
            tick={{ fontSize: 11, fill: "#737373" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="scale"
            stroke="#c4b5fd"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="trend"
            stroke="#5b21b6"
            strokeWidth={3}
            dot={(props) => {
              const { cx, cy, index } = props;
              return (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill="#5b21b6"
                  data-testid="chart-point"
                />
              );
            }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
