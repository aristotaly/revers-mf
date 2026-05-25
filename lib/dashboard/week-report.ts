import { normalizeDate, toDateKey } from "@/utils/analytics";

export type WeekReportEntry = {
  date: string;
  dayLabel: string;
  weight: number | null;
};

/** Last 7 calendar days ending on `now` (local), inclusive. */
export function getLast7DaysRangeLocal(now: Date = new Date()): {
  start: Date;
  end: Date;
  label: string;
} {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - 6);

  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const yearFmt = new Intl.DateTimeFormat("en-US", { year: "numeric" });
  const label = `Last 7 days: ${fmt.format(start)} – ${fmt.format(end)}, ${yearFmt.format(end)}`;

  return { start, end, label };
}

/** @deprecated Use getLast7DaysRangeLocal */
export const getCurrentWeekRangeLocal = getLast7DaysRangeLocal;

const dayFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "numeric",
  day: "numeric",
});

export function buildWeekReportEntries(
  entriesByDate: Map<string, number>,
  now: Date = new Date(),
): WeekReportEntry[] {
  const { start, end } = getLast7DaysRangeLocal(now);
  const result: WeekReportEntry[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = new Date(d);
    const key = toDateKey(normalizeDate(day));
    result.push({
      date: key,
      dayLabel: dayFmt.format(day),
      weight: entriesByDate.get(key) ?? null,
    });
  }

  return result;
}

export function weighInDaysToEntriesMap(
  days: { date: string; weight?: number }[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const d of days) {
    if (d.weight != null) map.set(d.date, d.weight);
  }
  return map;
}
