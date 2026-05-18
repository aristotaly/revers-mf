import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "session";

type SessionPayload = {
  userId: string;
};

function getSecret(): string {
  return process.env.SESSION_SECRET ?? "dev-secret-change-in-production";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const payload = JSON.stringify({ userId } satisfies SessionPayload);
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = sign(encoded);
  const token = `${encoded}.${signature}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || sign(encoded) !== signature) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
