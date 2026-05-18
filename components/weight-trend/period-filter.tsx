"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeWindow } from "@/utils/analytics";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const WINDOWS: TimeWindow[] = ["1W", "1M", "3M", "6M", "1Y", "All"];

type PeriodFilterProps = {
  active: TimeWindow;
  onChange: (window: TimeWindow) => void;
};

export function PeriodFilter({ active, onChange }: PeriodFilterProps) {
  return (
    <div className="flex items-center gap-2 px-4 pb-2">
      <div className="flex flex-1 gap-1 overflow-x-auto">
        {WINDOWS.map((w) => (
          <button
            key={w}
            type="button"
            data-testid={`filter-${w}`}
            onClick={() => onChange(w)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              active === w
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-700",
            )}
          >
            {w}
          </button>
        ))}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex shrink-0 items-center gap-0.5 rounded-full bg-neutral-100 px-2.5 py-1.5 text-sm font-medium text-neutral-700"
          >
            D
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Daily</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
