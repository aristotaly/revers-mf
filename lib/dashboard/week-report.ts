import { normalizeDate, toDateKey } from "@/utils/analytics";

export type WeekReportEntry = {
  date: string;
  dayLabel: string;
  weight: number | null;
};

/** Sunday 00:00 local → today (local), inclusive. */
export function getCurrentWeekRangeLocal(now: Date = new Date()): {
  start: Date;
  end: Date;
  label: string;
} {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - end.getDay());

  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const yearFmt = new Intl.DateTimeFormat("en-US", { year: "numeric" });
  const label = `${fmt.format(start)} – ${fmt.format(end)}, ${yearFmt.format(end)}`;

  return { start, end, label };
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function buildWeekReportEntries(
  entriesByDate: Map<string, number>,
  now: Date = new Date(),
): WeekReportEntry[] {
  const { start, end } = getCurrentWeekRangeLocal(now);
  const result: WeekReportEntry[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = new Date(d);
    const key = toDateKey(normalizeDate(day));
    result.push({
      date: key,
      dayLabel: DAY_LABELS[day.getDay()],
      weight: entriesByDate.get(key) ?? null,
    });
  }

  return result;
}
