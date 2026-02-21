import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DB_URI;
if (!connectionString) throw new Error("DB_URI is required");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = [
    { name: "FLEET_MANAGER" as const },
    { name: "DISPATCHER" as const },
    { name: "SAFETY_OFFICER" as const },
    { name: "FINANCIAL_ANALYST" as const },
  ];
  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      create: r,
      update: {},
    });
  }
  console.log("Roles seeded");

  // Optional: create default fleet stats row
  const existing = await prisma.fleetStats.findFirst();
  if (!existing) {
    await prisma.fleetStats.create({
      data: {
        activeFleetCount: 0,
        maintenanceAlertsCount: 0,
        utilizationRatePct: 0,
        pendingCargoCount: 0,
      },
    });
    console.log("FleetStats initialized");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
