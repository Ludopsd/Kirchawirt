import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from "./session";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireUser(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/invoices");
  return user;
}
