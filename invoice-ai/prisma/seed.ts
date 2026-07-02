import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedDatabase } from "../src/lib/setup/seed-database";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await seedDatabase(prisma);
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "changeme123";
  console.log(
    `Admin-Login angelegt/vorhanden: ${result.adminEmail} / ${adminPassword} (bitte nach dem ersten Login ändern)`
  );
  console.log(`${result.accountsCount} Sachkonten angelegt/vorhanden.`);
  console.log(`${result.suppliersCount} neue Beispiel-Lieferanten angelegt.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
