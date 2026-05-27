"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, requireWriter } from "@/lib/session";
import { normalizeDate } from "@/utils/analytics";

const entrySchema = z.object({
  weight: z.coerce.number().positive().max(500),
  date: z.coerce.date(),
});

/**
 * Resolve the writer's userId. Throws for viewers — they must never reach
 * a mutating server action, even if they hand-craft a fetch call.
 */
async function requireWriterUserId(): Promise<string> {
  const me = await requireWriter();
  return me.id;
}

export async function upsertWeightEntry(formData: FormData) {
  const userId = await requireWriterUserId();
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

  revalidatePath("/dashboard");
  revalidatePath("/weight-trend");
  revalidatePath("/scale-weight");
  revalidatePath("/weight-trend/logs");
  return { success: true };
}

export async function deleteWeightEntry(id: string) {
  const userId = await requireWriterUserId();
  await prisma.weightEntry.deleteMany({
    where: { id, userId },
  });
  revalidatePath("/dashboard");
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
