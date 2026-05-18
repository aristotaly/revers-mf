"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, clearSession } from "@/lib/session";

export async function loginAction(
  formData: FormData,
): Promise<{ error: string } | void> {
  const passcode = String(formData.get("passcode") ?? "");
  const user = await prisma.user.findFirst();
  if (!user) {
    return { error: "No user configured. Run npm run db:seed." };
  }

  const valid = await bcrypt.compare(passcode, user.passcodeHash);
  if (!valid) {
    return { error: "Invalid passcode." };
  }

  await createSession(user.id);
  redirect("/weight-trend");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
