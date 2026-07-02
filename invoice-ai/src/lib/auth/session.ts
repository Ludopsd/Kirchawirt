import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/generated/prisma/enums";

const SESSION_COOKIE_NAME = "invoice_ai_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 Tage

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === "change-me-to-a-long-random-string") {
    throw new Error(
      "AUTH_SECRET ist nicht gesetzt (oder noch der Platzhalter). Bitte in .env einen zufälligen langen String eintragen."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.name === "string" &&
      typeof payload.role === "string"
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role as UserRole,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS };
