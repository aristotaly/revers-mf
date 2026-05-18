import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const count = await p.weightEntry.count();
  console.log("Total entries:", count);

  const first = await p.weightEntry.findMany({
    orderBy: { date: "asc" },
    take: 5,
  });
  console.log(
    "First 5:",
    first.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      weight: r.weight,
    })),
  );

  const last = await p.weightEntry.findMany({
    orderBy: { date: "desc" },
    take: 5,
  });
  console.log(
    "Last 5:",
    last.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      weight: r.weight,
    })),
  );

  // Check a few specific dates
  const oct31 = await p.weightEntry.findFirst({
    where: { date: new Date(Date.UTC(2024, 9, 31)) },
  });
  console.log(
    "2024-10-31:",
    oct31 ? `weight=${oct31.weight}` : "NOT FOUND",
  );

  const may18 = await p.weightEntry.findFirst({
    where: { date: new Date(Date.UTC(2026, 4, 18)) },
  });
  console.log(
    "2026-05-18:",
    may18 ? `weight=${may18.weight}` : "NOT FOUND",
  );

  await p.$disconnect();
}

main();
