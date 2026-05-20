import { prisma } from "@/lib/prisma";
import {
  buildDailySeries,
  normalizeDate,
  toDateKey,
  type DailyPoint,
} from "@/utils/analytics";
import {
  computeGoalProgressPercent,
  resolveGoalStartWeight,
} from "@/utils/goal-progress";
import { buildWeekReportEntries, type WeekReportEntry } from "./week-report";

export type WeighInDay = {
  date: string;
  hasEntry: boolean;
  weight?: number;
};

export type TrendMiniPoint = {
  date: string;
  trend: number;
};

export type DashboardGoal = {
  targetWeight: number;
  startWeight: number;
  currentWeight: number;
  progressPercent: number;
  daysSinceStart: number;
  kgRemaining: number;
};

export type DashboardPayload = {
  weighInDays: WeighInDay[];
  weekLogged: number;
  trendPoints7d: TrendMiniPoint[];
  latestTrend: number | null;
  latestScale: number | null;
  goal: DashboardGoal | null;
  weekReport: WeekReportEntry[];
};

function addDays(date: Date, days: number): Date {
  const d = normalizeDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function daysBetween(start: Date, end: Date): number {
  return Math.round(
    (normalizeDate(end).getTime() - normalizeDate(start).getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function buildWeighInGrid(
  entriesByDate: Map<string, number>,
  today: Date,
): WeighInDay[] {
  const days: WeighInDay[] = [];
  const start = addDays(today, -29);
  for (let i = 0; i < 30; i++) {
    const date = addDays(start, i);
    const key = toDateKey(date);
    const weight = entriesByDate.get(key);
    days.push({
      date: key,
      hasEntry: weight != null,
      weight,
    });
  }
  return days;
}

function countWeekLogged(entriesByDate: Map<string, number>, today: Date): number {
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const key = toDateKey(addDays(today, -i));
    if (entriesByDate.has(key)) count++;
  }
  return count;
}

function sliceLast7Trend(points: DailyPoint[]): TrendMiniPoint[] {
  if (points.length === 0) return [];
  const end = points[points.length - 1].date;
  const start = addDays(end, -6);
  return points
    .filter((p) => p.date >= start && p.date <= end)
    .map((p) => ({ date: toDateKey(p.date), trend: p.trendRounded }));
}

export async function buildDashboardData(
  userId: string,
): Promise<DashboardPayload> {
  const today = normalizeDate(new Date());

  const [entries, goal] = await Promise.all([
    prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    }),
    prisma.weightGoal.findUnique({ where: { userId } }),
  ]);

  const entriesByDate = new Map<string, number>();
  for (const e of entries) {
    entriesByDate.set(toDateKey(e.date), e.weight);
  }

  const loggedEntries = entries.map((e) => ({
    date: e.date,
    weight: e.weight,
  }));
  const allPoints = buildDailySeries(loggedEntries, today);
  const trendPoints7d = sliceLast7Trend(allPoints);
  const latestTrend =
    allPoints.length > 0 ? allPoints[allPoints.length - 1].trendRounded : null;
  const latestScale =
    entries.length > 0 ? entries[entries.length - 1].weight : null;
  const currentWeight = latestScale ?? latestTrend;
  const allLoggedWeights = entries.map((e) => e.weight);

  let dashboardGoal: DashboardGoal | null = null;
  if (goal && currentWeight != null) {
    const startWeight = resolveGoalStartWeight(
      goal.startWeight,
      goal.targetWeight,
      allLoggedWeights,
      currentWeight,
    );
    const progressPercent = computeGoalProgressPercent(
      startWeight,
      goal.targetWeight,
      currentWeight,
    );
    dashboardGoal = {
      targetWeight: goal.targetWeight,
      startWeight,
      currentWeight,
      progressPercent,
      daysSinceStart: daysBetween(goal.createdAt, today) + 1,
      kgRemaining: Math.round(Math.abs(currentWeight - goal.targetWeight) * 10) / 10,
    };
  }

  return {
    weighInDays: buildWeighInGrid(entriesByDate, today),
    weekLogged: countWeekLogged(entriesByDate, today),
    trendPoints7d,
    latestTrend,
    latestScale,
    goal: dashboardGoal,
    weekReport: buildWeekReportEntries(entriesByDate),
  };
}
