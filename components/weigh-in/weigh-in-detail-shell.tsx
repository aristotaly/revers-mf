"use client";

import { useMemo, useState } from "react";
import type { WeighInDetailPayload } from "@/lib/weigh-in/build-detail-data";
import {
  buildCalendarWeeks,
  buildYearHeatmap,
  MONTH_LABELS,
  todayUtc,
  type CalendarCell,
  type YearHeatmap,
} from "@/lib/weigh-in/calendar";
import { AppHeader } from "@/components/layout/app-header";
import { EntryFormDialog } from "@/components/scale-weight/entry-form-dialog";
import { MonthCalendar } from "./month-calendar";
import { MonthFilters } from "./month-filters";
import { LegendCard } from "./legend-card";
import { YearContributionRow } from "./year-contribution-row";

type WeighInDetailShellProps = {
  data: WeighInDetailPayload;
};

export function WeighInDetailShell({ data }: WeighInDetailShellProps) {
  // `todayUtc()` returns a fresh Date object every call; memoise so dependent
  // `useMemo`s don't re-run on every render.
  const today = useMemo(() => todayUtc(), []);
  const [year, setYear] = useState<number>(today.getUTCFullYear());
  const [month, setMonth] = useState<number>(today.getUTCMonth()); // 0-indexed
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<{ date: string } | null>(null);

  const trackedKeys = useMemo(() => new Set(data.trackedKeys), [data.trackedKeys]);

  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(year, month, trackedKeys, today),
    [year, month, trackedKeys, today],
  );

  // Re-derive the displayed year heatmap if the user picks a year that isn't
  // pre-baked (shouldn't happen unless they navigate far in the future, but
  // it keeps the UI honest).
  const displayedYears = useMemo<YearHeatmap[]>(() => {
    const baked = new Map(data.years.map((y) => [y.year, y]));
    if (!baked.has(year)) {
      baked.set(year, buildYearHeatmap(year, trackedKeys, today));
    }
    return [...baked.values()].sort((a, b) => b.year - a.year);
  }, [data.years, year, trackedKeys, today]);

  const yearOptions = useMemo(() => {
    const set = new Set<number>([today.getUTCFullYear(), year]);
    for (const y of data.years) set.add(y.year);
    return [...set].sort((a, b) => b - a);
  }, [data.years, year, today]);

  function handleStep(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  }

  function handleDayClick(cell: CalendarCell) {
    if (cell.isFuture) return;
    setSelected({ date: cell.date });
    setDialogOpen(true);
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <AppHeader title="Weigh-In" backHref="/dashboard" />

      <div className="space-y-6 px-4 py-5">
        <MetricsBar
          todayWeight={data.headerWeight}
          streakDays={data.streakDays}
        />

        <MonthCalendar
          weeks={calendarWeeks}
          onDayClick={handleDayClick}
        />

        <MonthFilters
          month={month}
          year={year}
          monthOptions={MONTH_LABELS.map((label, i) => ({ value: i, label }))}
          yearOptions={yearOptions}
          onStep={handleStep}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />

        <LegendCard />

        <section
          className="space-y-6"
          aria-label="Multi-year tracking history"
          data-testid="year-heatmaps"
        >
          {displayedYears.map((y) => (
            <YearContributionRow key={y.year} heatmap={y} />
          ))}
        </section>
      </div>

      {selected && (
        <EntryFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initial={{ date: selected.date }}
        />
      )}
    </div>
  );
}

function MetricsBar({
  todayWeight,
  streakDays,
}: {
  todayWeight: number | null;
  streakDays: number;
}) {
  return (
    <div
      className="flex items-start justify-between"
      data-testid="weigh-in-metrics"
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500">Today</p>
        <p className="mt-1 flex items-baseline gap-1 text-3xl font-bold tracking-tight text-neutral-900">
          {todayWeight != null ? todayWeight.toFixed(1) : "—"}
          <span className="text-sm font-medium text-neutral-500">kg</span>
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Streak</p>
        <p className="mt-1 flex items-baseline justify-end gap-1 text-3xl font-bold tracking-tight text-neutral-900">
          {streakDays}
          <span className="text-sm font-medium text-neutral-500">days</span>
        </p>
      </div>
    </div>
  );
}
