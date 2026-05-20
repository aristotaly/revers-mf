import { toDateKey } from "@/utils/analytics";

export type CalendarCell = {
  date: string;
  day: number;
  inMonth: boolean;
  tracked: boolean;
  isToday: boolean;
  isFuture: boolean;
};

export type YearHeatmapDay = {
  date: string;
  day: number;
  tracked: boolean;
  isFuture: boolean;
};

export type YearHeatmapMonth = {
  monthIndex: number;
  label: string;
  /** 6 rows × 7 cols (Mon..Sun). Days outside the month are `null`. */
  weeks: Array<Array<YearHeatmapDay | null>>;
};

export type YearHeatmap = {
  year: number;
  months: YearHeatmapMonth[];
};

export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Returns ISO day-of-week with Monday = 0 … Sunday = 6 (matches the design). */
function mondayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Today, normalised to a UTC date with 00:00:00. */
export function todayUtc(now: Date = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/** Builds 6 weeks × 7 days of calendar cells, overflow days included. */
export function buildCalendarWeeks(
  year: number,
  month: number,
  trackedKeys: ReadonlySet<string>,
  today: Date,
): CalendarCell[][] {
  const todayKey = toDateKey(today);
  const firstOfMonth = utcDate(year, month, 1);
  const leadingBlanks = mondayIndex(firstOfMonth);
  const gridStart = addDays(firstOfMonth, -leadingBlanks);

  const weeks: CalendarCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = addDays(gridStart, w * 7 + d);
      const key = toDateKey(cellDate);
      row.push({
        date: key,
        day: cellDate.getUTCDate(),
        inMonth: cellDate.getUTCMonth() === month,
        tracked: trackedKeys.has(key),
        isToday: key === todayKey,
        isFuture: cellDate.getTime() > today.getTime(),
      });
    }
    weeks.push(row);
  }
  return weeks;
}

/** Year-long heatmap: 12 months × (6 weeks × 7 days). */
export function buildYearHeatmap(
  year: number,
  trackedKeys: ReadonlySet<string>,
  today: Date,
): YearHeatmap {
  const months: YearHeatmapMonth[] = [];
  for (let m = 0; m < 12; m++) {
    const firstOfMonth = utcDate(year, m, 1);
    const leadingBlanks = mondayIndex(firstOfMonth);
    const totalDays = daysInMonth(year, m);
    const weeks: Array<Array<YearHeatmapDay | null>> = [];
    for (let w = 0; w < 6; w++) {
      const row: Array<YearHeatmapDay | null> = [];
      for (let d = 0; d < 7; d++) {
        const offset = w * 7 + d - leadingBlanks;
        if (offset < 0 || offset >= totalDays) {
          row.push(null);
        } else {
          const cellDate = utcDate(year, m, offset + 1);
          const key = toDateKey(cellDate);
          row.push({
            date: key,
            day: offset + 1,
            tracked: trackedKeys.has(key),
            isFuture: cellDate.getTime() > today.getTime(),
          });
        }
      }
      weeks.push(row);
    }
    months.push({ monthIndex: m, label: MONTH_LABELS[m], weeks });
  }
  return { year, months };
}

/** Counts consecutive tracked days ending today. Today is allowed to be
 *  unlogged (you haven't weighed in yet) without breaking the streak. */
export function computeStreak(
  trackedKeys: ReadonlySet<string>,
  today: Date,
): number {
  let streak = 0;
  for (let i = 0; i < 3650; i++) {
    const key = toDateKey(addDays(today, -i));
    if (trackedKeys.has(key)) {
      streak++;
    } else {
      if (i === 0) continue;
      break;
    }
  }
  return streak;
}
