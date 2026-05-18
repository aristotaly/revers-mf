import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { buildDailySeries } from "@/utils/analytics";
import { WeightTrendShell } from "@/components/weight-trend/weight-trend-shell";

export default async function WeightTrendPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const entries = await prisma.weightEntry.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });

  const loggedEntries = entries.map((e) => ({
    date: e.date,
    weight: e.weight,
  }));

  const allPoints = buildDailySeries(loggedEntries);

  return (
    <WeightTrendShell
      allPoints={allPoints}
      loggedEntries={loggedEntries}
    />
  );
}
