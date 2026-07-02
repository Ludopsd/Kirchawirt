import "server-only";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/generated/prisma/client";

const DEFAULT_ACCOUNTS: { accountNumber: string; accountName: string; accountType: string }[] = [
  { accountNumber: "3200", accountName: "Wareneingang / Wareneinkauf", accountType: "Aufwand" },
  { accountNumber: "3300", accountName: "Bezogene Leistungen", accountType: "Aufwand" },
  { accountNumber: "4900", accountName: "Bürobedarf", accountType: "Aufwand" },
  { accountNumber: "4930", accountName: "Telekommunikation", accountType: "Aufwand" },
  { accountNumber: "6300", accountName: "Energiekosten (Strom, Gas)", accountType: "Aufwand" },
  { accountNumber: "1600", accountName: "Verbindlichkeiten aus Lieferungen und Leistungen", accountType: "Passiv" },
];

const DEFAULT_SUPPLIERS: {
  name: string;
  normalizedName: string;
  aliases: string[];
  kreditorenkonto: string;
  defaultSachkonto: string;
  city: string;
}[] = [
  {
    name: "Getränke Müller GmbH",
    normalizedName: "getranke muller",
    aliases: ["Getraenke Mueller", "Müller Getränke"],
    kreditorenkonto: "70001",
    defaultSachkonto: "3200",
    city: "München",
  },
  {
    name: "Stadtwerke Musterstadt",
    normalizedName: "stadtwerke musterstadt",
    aliases: [],
    kreditorenkonto: "70002",
    defaultSachkonto: "6300",
    city: "Musterstadt",
  },
  {
    name: "Bürobedarf Schmidt e.K.",
    normalizedName: "burobedarf schmidt",
    aliases: ["Buerobedarf Schmidt"],
    kreditorenkonto: "70003",
    defaultSachkonto: "4900",
    city: "Musterstadt",
  },
];

export interface SeedResult {
  adminEmail: string;
  adminPasswordWasSet: boolean;
  accountsCount: number;
  suppliersCount: number;
}

/**
 * Legt (idempotent) einen Admin-Login sowie Beispiel-Stammdaten an. Wird sowohl vom CLI-Skript
 * (prisma/seed.ts, für lokale/Docker-Umgebungen mit Terminalzugriff) als auch von der
 * Browser-Setup-Route (src/app/api/setup/route.ts, für Deployments ohne Terminalzugriff, z.B. Vercel) genutzt.
 */
export async function seedDatabase(prisma: PrismaClient): Promise<SeedResult> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@invoice-ai.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "changeme123";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, name: "Administrator", role: "ADMIN" },
  });

  for (const account of DEFAULT_ACCOUNTS) {
    await prisma.chartOfAccountsEntry.upsert({
      where: { accountNumber: account.accountNumber },
      update: {},
      create: account,
    });
  }

  let suppliersCreated = 0;
  for (const supplier of DEFAULT_SUPPLIERS) {
    const existing = await prisma.supplier.findFirst({ where: { normalizedName: supplier.normalizedName } });
    if (!existing) {
      await prisma.supplier.create({ data: supplier });
      suppliersCreated++;
    }
  }

  return {
    adminEmail,
    adminPasswordWasSet: !existingAdmin,
    accountsCount: DEFAULT_ACCOUNTS.length,
    suppliersCount: suppliersCreated,
  };
}
