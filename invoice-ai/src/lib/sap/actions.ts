"use server";

import { requireAdmin } from "@/lib/auth/current-user";
import { getSapConnector } from "./connector-factory";

export async function testSapConnectionAction(): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  const connector = getSapConnector();
  return connector.testConnection();
}
