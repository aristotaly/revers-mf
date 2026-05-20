import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/utils/analytics";
import {
  computeStreak,
  todayUtc,
  type YearHeatmap,
  buildYearHeatmap,
} from "./calendar";

export type WeighInDetailPayload = {
  /** ISO date key (yyyy-mm-dd) for "today" in UTC. */
  todayKey: string;
  /** Most-recent logged scale weight (today's if logged, otherwise the latest entry). */
  headerWeight: number | null;
  streakDays: number;
  /** All ISO date keys with a logged weight. Sent to the client so it can
   *  rebuild the calendar for any month without a server round-trip. */
  trackedKeys: string[];
  /** Pre-built per-year heatmaps, newest first (max 5 years). */
  years: YearHeatmap[];
};

export async function buildWeighInDetailData(
  userId: string,
): Promise<WeighInDetailPayload> {
  const today = todayUtc();
  const todayKey = toDateKey(today);

  const entries = await prisma.weightEntry.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    select: { date: true, weight: true },
  });

  const trackedKeys = new Set<string>();
  let todayWeight: number | null = null;
  let mostRecentWeight: number | null = null;

  for (const e of entries) {
    const key = toDateKey(e.date);
    trackedKeys.add(key);
    mostRecentWeight = e.weight;
    if (key === todayKey) todayWeight = e.weight;
  }

  const headerWeight = todayWeight ?? mostRecentWeight;

  const yearsWithData = new Set<number>([today.getUTCFullYear()]);
  for (const e of entries) {
    yearsWithData.add(e.date.getUTCFullYear());
  }
  const years = [...yearsWithData]
    .sort((a, b) => b - a)
    .slice(0, 5)
    .map((y) => buildYearHeatmap(y, trackedKeys, today));

  return {
    todayKey,
    headerWeight,
    streakDays: computeStreak(trackedKeys, today),
    trackedKeys: [...trackedKeys],
    years,
  };
}
