"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type KpiSummaryProps = {
  average: number;
  difference: number;
  dateRangeLabel: string;
};

export function KpiSummary({
  average,
  difference,
  dateRangeLabel,
}: KpiSummaryProps) {
  const diffLabel =
    difference > 0 ? `+${difference.toFixed(1)}` : difference.toFixed(1);

  return (
    <div className="flex items-start gap-4 px-4 py-4" data-testid="kpi-summary">
      <div className="flex-1">
        <p className="text-xs text-neutral-500">Average</p>
        <p
          className="text-3xl font-bold tracking-tight text-neutral-900"
          data-testid="kpi-average"
        >
          {average.toFixed(1)} kg
        </p>
        <p
          className="mt-0.5 text-xs text-neutral-400"
          data-testid="kpi-date-range"
        >
          {dateRangeLabel}
        </p>
      </div>
      <div className="flex-1">
        <p className="text-xs text-neutral-500">Difference</p>
        <p
          className="text-3xl font-bold tracking-tight text-neutral-900"
          data-testid="kpi-difference"
        >
          {diffLabel} kg
        </p>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="mt-1 h-10 w-10 shrink-0 rounded-full border-neutral-200 bg-neutral-100"
            aria-label="Chart settings"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <p className="text-sm font-medium">Chart settings</p>
          <p className="mt-1 text-xs text-neutral-500">
            Show scale and trend lines (both enabled).
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
