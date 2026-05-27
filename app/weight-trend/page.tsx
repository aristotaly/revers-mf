import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { resolvePageView } from "@/lib/viewer";
import { buildDailySeries, normalizeDate } from "@/utils/analytics";
import { WeightTrendShell } from "@/components/weight-trend/weight-trend-shell";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ asOf?: string }>;
};

export default async function WeightTrendPage({ searchParams }: Props) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const view = await resolvePageView(me);
  if (!view) redirect("/dashboard");

  const params = await searchParams;
  // Optional deterministic "today" for tests / replay. Format: YYYY-MM-DD.
  let fixedDate: Date | undefined;
  if (params?.asOf && /^\d{4}-\d{2}-\d{2}$/.test(params.asOf)) {
    const [y, m, d] = params.asOf.split("-").map((s) => parseInt(s, 10));
    fixedDate = new Date(Date.UTC(y, m - 1, d));
  }

  const entries = await prisma.weightEntry.findMany({
    where: { userId: view.viewing.id },
    orderBy: { date: "asc" },
  });

  const loggedEntries = entries.map((e) => ({
    date: e.date,
    weight: e.weight,
  }));

  const allPoints = buildDailySeries(loggedEntries, fixedDate ?? new Date());

  return (
    <WeightTrendShell
      allPoints={allPoints}
      loggedEntries={loggedEntries}
      fixedDate={fixedDate ? normalizeDate(fixedDate) : undefined}
      currentUser={view.session}
      viewing={view.viewing}
      isViewer={view.isViewer}
      otherTargets={view.otherTargets}
    />
  );
}
