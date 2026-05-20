"use client";

import type { CalendarCell } from "@/lib/weigh-in/calendar";
import { DOW_LABELS } from "@/lib/weigh-in/calendar";

type MonthCalendarProps = {
  weeks: CalendarCell[][];
  onDayClick: (cell: CalendarCell) => void;
};

export function MonthCalendar({ weeks, onDayClick }: MonthCalendarProps) {
  return (
    <div data-testid="month-calendar">
      <div className="grid grid-cols-7 gap-y-2.5">
        {weeks.flat().map((cell, i) => (
          <DayCell key={`${cell.date}-${i}`} cell={cell} onClick={onDayClick} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-7 text-center text-xs font-medium text-neutral-500">
        {DOW_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </div>
  );
}

function DayCell({
  cell,
  onClick,
}: {
  cell: CalendarCell;
  onClick: (cell: CalendarCell) => void;
}) {
  // Out-of-month overflow days: borderless faint number, not interactive.
  if (!cell.inMonth) {
    return (
      <div className="flex h-10 items-center justify-center">
        <span className="text-sm text-neutral-300">{cell.day}</span>
      </div>
    );
  }

  const isTracked = cell.tracked;
  const isToday = cell.isToday;
  const isFuture = cell.isFuture;

  let ring = "ring-1 ring-neutral-200"; // future or untracked default
  if (isTracked) ring = "ring-[1.5px] ring-emerald-500";
  if (isToday) ring = "ring-2 ring-emerald-500";

  const ariaLabel = `${cell.date}${
    isTracked ? " — tracked" : isFuture ? " — future" : " — untracked"
  }${isToday ? " (today)" : ""}`;

  return (
    <button
      type="button"
      onClick={() => onClick(cell)}
      disabled={isFuture}
      data-testid={`weigh-in-detail-day-${cell.date}`}
      aria-label={ariaLabel}
      className={
        "relative flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-transparent " +
        "transition-colors enabled:hover:bg-emerald-50 disabled:cursor-default " +
        ring
      }
    >
      <span
        className={
          "text-sm " +
          (isFuture
            ? "text-neutral-400"
            : isToday
              ? "font-semibold text-neutral-900"
              : "text-neutral-900")
        }
      >
        {cell.day}
      </span>
      {isToday && (
        <span
          aria-hidden
          className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-neutral-900"
        />
      )}
    </button>
  );
}
