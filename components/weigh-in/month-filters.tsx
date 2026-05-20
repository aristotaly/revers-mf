"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type MonthOption = { value: number; label: string };

type MonthFiltersProps = {
  month: number;
  year: number;
  monthOptions: ReadonlyArray<MonthOption>;
  yearOptions: ReadonlyArray<number>;
  onStep: (delta: number) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
};

export function MonthFilters({
  month,
  year,
  monthOptions,
  yearOptions,
  onStep,
  onMonthChange,
  onYearChange,
}: MonthFiltersProps) {
  return (
    <div
      className="flex items-center justify-center gap-3"
      data-testid="month-filters"
    >
      <div className="flex h-9 items-center gap-1 rounded-full bg-white px-2 ring-1 ring-neutral-200">
        <button
          type="button"
          onClick={() => onStep(-1)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => onStep(1)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <SelectPill
        ariaLabel="Select month"
        value={month}
        onChange={(v) => onMonthChange(Number(v))}
      >
        {monthOptions.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </SelectPill>

      <SelectPill
        ariaLabel="Select year"
        value={year}
        onChange={(v) => onYearChange(Number(v))}
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </SelectPill>
    </div>
  );
}

function SelectPill({
  value,
  onChange,
  children,
  ariaLabel,
}: {
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <div className="relative h-9">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-full bg-white px-4 pr-9 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
        strokeWidth={1.75}
        aria-hidden
      />
    </div>
  );
}
