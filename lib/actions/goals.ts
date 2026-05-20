"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { buildDailySeries, normalizeDate } from "@/utils/analytics";

const goalSchema = z.object({
  targetWeight: z.coerce.number().positive().max(500),
  startWeight: z.coerce.number().positive().max(500).optional(),
});

async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export type UserGoal = {
  id: string;
  targetWeight: number;
  startWeight: number;
  createdAt: string;
};

export async function getUserGoal(): Promise<UserGoal | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const goal = await prisma.weightGoal.findUnique({ where: { userId } });
  if (!goal) return null;

  return {
    id: goal.id,
    targetWeight: goal.targetWeight,
    startWeight: goal.startWeight,
    createdAt: goal.createdAt.toISOString(),
  };
}

export async function upsertUserGoal(formData: FormData) {
  const userId = await requireUserId();
  const parsed = goalSchema.safeParse({
    targetWeight: formData.get("targetWeight"),
    startWeight: formData.get("startWeight") || undefined,
  });

  if (!parsed.success) {
    return { error: "Enter a valid target weight." };
  }

  let startWeight = parsed.data.startWeight;
  if (startWeight == null) {
    const allEntries = await prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    });
    if (allEntries.length > 0) {
      const series = buildDailySeries(
        allEntries.map((e) => ({ date: e.date, weight: e.weight })),
      );
      startWeight =
        series.length > 0
          ? series[series.length - 1].trendRounded
          : allEntries[allEntries.length - 1].weight;
    } else {
      startWeight = parsed.data.targetWeight;
    }
  }

  await prisma.weightGoal.upsert({
    where: { userId },
    create: {
      userId,
      targetWeight: parsed.data.targetWeight,
      startWeight,
    },
    update: {
      targetWeight: parsed.data.targetWeight,
      startWeight,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/goal");
  return { success: true };
}

export async function deleteUserGoal() {
  const userId = await requireUserId();
  await prisma.weightGoal.deleteMany({ where: { userId } });
  revalidatePath("/dashboard");
  revalidatePath("/goal");
  return { success: true };
}
