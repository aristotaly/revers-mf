"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { normalizeDate } from "@/utils/analytics";

const entrySchema = z.object({
  weight: z.coerce.number().positive().max(500),
  date: z.coerce.date(),
});

async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function upsertWeightEntry(formData: FormData) {
  const userId = await requireUserId();
  const parsed = entrySchema.safeParse({
    weight: formData.get("weight"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { error: "Invalid weight or date." };
  }

  const date = normalizeDate(parsed.data.date);

  await prisma.weightEntry.upsert({
    where: {
      userId_date: { userId, date },
    },
    create: {
      userId,
      date,
      weight: parsed.data.weight,
    },
    update: {
      weight: parsed.data.weight,
    },
  });

  revalidatePath("/weight-trend");
  revalidatePath("/scale-weight");
  revalidatePath("/weight-trend/logs");
  return { success: true };
}

export async function deleteWeightEntry(id: string) {
  const userId = await requireUserId();
  await prisma.weightEntry.deleteMany({
    where: { id, userId },
  });
  revalidatePath("/weight-trend");
  revalidatePath("/scale-weight");
  revalidatePath("/weight-trend/logs");
  return { success: true };
}

export async function getUserWeightEntries() {
  const userId = await getSessionUserId();
  if (!userId) return [];

  return prisma.weightEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
}
