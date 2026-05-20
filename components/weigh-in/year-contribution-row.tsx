"use client";

import type { YearHeatmap, YearHeatmapMonth } from "@/lib/weigh-in/calendar";

type YearContributionRowProps = {
  heatmap: YearHeatmap;
};

export function YearContributionRow({ heatmap }: YearContributionRowProps) {
  return (
    <div data-testid={`year-heatmap-${heatmap.year}`}>
      <h3 className="text-base font-bold text-neutral-900">{heatmap.year}</h3>
      <div className="mt-2 overflow-x-auto">
        <div className="flex items-end gap-1.5">
          {heatmap.months.map((m) => (
            <MonthColumn key={m.monthIndex} month={m} />
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-12 gap-1.5 text-center text-[10px] font-medium text-neutral-500">
          {heatmap.months.map((m) => (
            <span key={m.monthIndex}>{m.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Renders a month as a 7-row × 6-col micro grid (rows = day of week,
 *  cols = week of month). Days outside the month render as empty space so
 *  every month occupies the same width on the page. */
function MonthColumn({ month }: { month: YearHeatmapMonth }) {
  // Transpose 6 weeks × 7 days into 7 rows × 6 cols.
  const rows: Array<Array<(typeof month.weeks)[number][number]>> = Array.from(
    { length: 7 },
    (_, dow) => month.weeks.map((week) => week[dow]),
  );

  return (
    <div className="flex flex-col gap-[2px]">
      {rows.map((row, dow) => (
        <div key={dow} className="flex gap-[2px]">
          {row.map((cell, w) => {
            if (!cell) {
              return (
                <span
                  key={`empty-${dow}-${w}`}
                  aria-hidden
                  className="h-[6px] w-[6px]"
                />
              );
            }
            const cls = cell.tracked
              ? "bg-emerald-500"
              : cell.isFuture
                ? "bg-neutral-200/70"
                : "bg-neutral-200";
            return (
              <span
                key={cell.date}
                title={`${cell.date}${cell.tracked ? " — tracked" : ""}`}
                className={`h-[6px] w-[6px] rounded-[1.5px] ${cls}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
