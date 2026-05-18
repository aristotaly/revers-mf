import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { buildDailySeries, normalizeDate, toDateKey } from "../utils/analytics";

const prisma = new PrismaClient();

/** Fixed "today" for deterministic Playwright assertions */
export const TEST_TODAY = new Date("2026-05-18T00:00:00.000Z");

export async function seedTestUser(mode: "default" | "ewma" | "gap" = "default") {
  const passcode = process.env.SEED_PASSCODE ?? "1234";
  const hash = await bcrypt.hash(passcode, 10);

  await prisma.weightEntry.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      id: "test-user",
      name: "Test",
      passcodeHash: hash,
    },
  });

  if (mode === "ewma") {
    const entries = [
      { daysAgo: 10, weight: 100 },
      { daysAgo: 5, weight: 90 },
      { daysAgo: 0, weight: 95 },
    ];
    for (const e of entries) {
      const date = new Date(TEST_TODAY);
      date.setUTCDate(date.getUTCDate() - e.daysAgo);
      await prisma.weightEntry.create({
        data: {
          userId: user.id,
          date: normalizeDate(date),
          weight: e.weight,
        },
      });
    }
    return user;
  }

  if (mode === "gap") {
    const entries = [
      { daysAgo: 10, weight: 94 },
      { daysAgo: 6, weight: 96 },
      { daysAgo: 0, weight: 95 },
    ];
    for (const e of entries) {
      const date = new Date(TEST_TODAY);
      date.setUTCDate(date.getUTCDate() - e.daysAgo);
      await prisma.weightEntry.create({
        data: {
          userId: user.id,
          date: normalizeDate(date),
          weight: e.weight,
        },
      });
    }
    return user;
  }

  for (let i = 0; i < 14; i++) {
    const date = new Date(TEST_TODAY);
    date.setUTCDate(date.getUTCDate() - i);
    await prisma.weightEntry.create({
      data: {
        userId: user.id,
        date: normalizeDate(date),
        weight: 95 + (i % 3) * 0.5,
      },
    });
  }

  return user;
}

export function expectedTrendForEwmaTest() {
  const entries = [
    { date: normalizeDate(new Date("2026-05-08T00:00:00.000Z")), weight: 100 },
    { date: normalizeDate(new Date("2026-05-13T00:00:00.000Z")), weight: 90 },
    { date: normalizeDate(TEST_TODAY), weight: 95 },
  ];
  const points = buildDailySeries(entries, TEST_TODAY);
  const byKey = Object.fromEntries(
    points.map((p) => [toDateKey(p.date), p.trendRounded]),
  );
  return byKey;
}

const mode = (process.argv[2] as "default" | "ewma" | "gap") ?? "default";
seedTestUser(mode)
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
