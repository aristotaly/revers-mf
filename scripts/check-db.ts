import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const count = await p.weightEntry.count();
  console.log("Count:", count);
  const first = await p.weightEntry.findMany({
    orderBy: { date: "asc" },
    take: 3,
  });
  console.log(
    "First 3:",
    first.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      weight: r.weight,
    })),
  );
  const last = await p.weightEntry.findMany({
    orderBy: { date: "desc" },
    take: 3,
  });
  console.log(
    "Last 3:",
    last.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      weight: r.weight,
    })),
  );
  await p.$disconnect();
}

main();
