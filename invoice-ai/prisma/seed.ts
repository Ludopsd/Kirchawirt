import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@invoice-ai.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "changeme123";

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: "Administrator",
      role: "ADMIN",
    },
  });
  console.log(`Admin-Login angelegt/vorhanden: ${adminEmail} / ${adminPassword} (bitte nach dem ersten Login ändern)`);

  const accounts: { accountNumber: string; accountName: string; accountType: string }[] = [
    { accountNumber: "3200", accountName: "Wareneingang / Wareneinkauf", accountType: "Aufwand" },
    { accountNumber: "3300", accountName: "Bezogene Leistungen", accountType: "Aufwand" },
    { accountNumber: "4900", accountName: "Bürobedarf", accountType: "Aufwand" },
    { accountNumber: "4930", accountName: "Telekommunikation", accountType: "Aufwand" },
    { accountNumber: "6300", accountName: "Energiekosten (Strom, Gas)", accountType: "Aufwand" },
    { accountNumber: "1600", accountName: "Verbindlichkeiten aus Lieferungen und Leistungen", accountType: "Passiv" },
  ];
  for (const account of accounts) {
    await prisma.chartOfAccountsEntry.upsert({
      where: { accountNumber: account.accountNumber },
      update: {},
      create: account,
    });
  }
  console.log(`${accounts.length} Sachkonten angelegt/vorhanden.`);

  const suppliers: {
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
  for (const supplier of suppliers) {
    const existing = await prisma.supplier.findFirst({ where: { normalizedName: supplier.normalizedName } });
    if (!existing) {
      await prisma.supplier.create({ data: supplier });
    }
  }
  console.log(`${suppliers.length} Beispiel-Lieferanten angelegt/vorhanden.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
