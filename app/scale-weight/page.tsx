import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ScaleWeightPageClient } from "@/components/scale-weight/scale-weight-page-client";

export default async function ScaleWeightPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  // Scale Weight is a logging screen; viewers can't log so we bounce them to
  // the trend page (read-only equivalent).
  if (me.role === "viewer") redirect("/weight-trend");

  const entries = await prisma.weightEntry.findMany({
    where: { userId: me.id },
    orderBy: { date: "desc" },
  });

  return (
    <ScaleWeightPageClient
      entries={entries.map((e) => ({
        id: e.id,
        date: e.date,
        weight: e.weight,
      }))}
    />
  );
}
