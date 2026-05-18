import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { ScaleWeightPageClient } from "@/components/scale-weight/scale-weight-page-client";

export default async function ScaleWeightPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const entries = await prisma.weightEntry.findMany({
    where: { userId },
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
