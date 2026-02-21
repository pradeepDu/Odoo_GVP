import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DB_URI;
if (!connectionString) throw new Error("DB_URI is required");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;
const SEED_PASSWORD = "password123";

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

  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);
  const fleetManagerRole = await prisma.role.findUnique({ where: { name: "FLEET_MANAGER" } });
  const dispatcherRole = await prisma.role.findUnique({ where: { name: "DISPATCHER" } });
  const analystRole = await prisma.role.findUnique({ where: { name: "FINANCIAL_ANALYST" } });
  const safetyRole = await prisma.role.findUnique({ where: { name: "SAFETY_OFFICER" } });

  const users = [
    { email: "manager@fleetflow.test", name: "Fleet Manager", roleId: fleetManagerRole!.id },
    { email: "dispatcher@fleetflow.test", name: "Dispatch Lead", roleId: dispatcherRole!.id },
    { email: "analyst@fleetflow.test", name: "Finance Analyst", roleId: analystRole!.id },
    { email: "safety@fleetflow.test", name: "Safety Officer", roleId: safetyRole!.id },
    { email: "driver1@fleetflow.test", name: "Raj Kumar", roleId: null },
    { email: "driver2@fleetflow.test", name: "Amit Singh", roleId: null },
    { email: "driver3@fleetflow.test", name: "Priya Sharma", roleId: null },
  ];
  const createdUsers: { id: number; email: string }[] = [];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: { ...u, password: hashedPassword },
      update: {},
    });
    createdUsers.push({ id: user.id, email: user.email });
  }
  console.log("Users seeded (password: " + SEED_PASSWORD + ")");

  const driverUserIds = createdUsers.filter((u) => u.email.startsWith("driver")).map((u) => u.id);
  const existingDrivers = await prisma.driver.count();
  let driverIds: number[] = [];
  if (existingDrivers === 0) {
    const baseDate = new Date();
    baseDate.setFullYear(baseDate.getFullYear() + 1);
    const drivers = await Promise.all([
      prisma.driver.create({
        data: {
          name: "Raj Kumar",
          licenseNumber: "DL01 2020 1234567",
          licenseExpiry: new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000),
          licenseCategory: "HGV",
          status: "ON_DUTY",
          userId: driverUserIds[0] ?? undefined,
        },
      }),
      prisma.driver.create({
        data: {
          name: "Amit Singh",
          licenseNumber: "DL02 2019 7654321",
          licenseExpiry: new Date(baseDate.getTime() + 180 * 24 * 60 * 60 * 1000),
          licenseCategory: "HGV",
          status: "OFF_DUTY",
          userId: driverUserIds[1] ?? undefined,
        },
      }),
      prisma.driver.create({
        data: {
          name: "Priya Sharma",
          licenseNumber: "DL03 2021 1122334",
          licenseExpiry: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000),
          licenseCategory: "LMV",
          status: "ON_DUTY",
          userId: driverUserIds[2] ?? undefined,
        },
      }),
    ]);
    driverIds = drivers.map((d) => d.id);
    console.log("Drivers seeded");
  } else {
    driverIds = (await prisma.driver.findMany({ select: { id: true } })).map((d) => d.id);
  }

  const existingVehicles = await prisma.vehicle.count();
  let vehicleIds: number[] = [];
  if (existingVehicles === 0) {
    const vehicles = await Promise.all([
      prisma.vehicle.create({
        data: {
          name: "TRK-01",
          model: "Ashok Leyland 3718",
          licensePlate: "MH12 AB 1234",
          maxCapacityKg: 9000,
          odometer: 45200,
          status: "ON_TRIP",
          vehicleType: "TRUCK",
          region: "Mumbai",
        },
      }),
      prisma.vehicle.create({
        data: {
          name: "TRK-02",
          model: "Tata Signa",
          licensePlate: "MH14 CD 5678",
          maxCapacityKg: 7500,
          odometer: 28100,
          status: "AVAILABLE",
          vehicleType: "TRUCK",
          region: "Pune",
        },
      }),
      prisma.vehicle.create({
        data: {
          name: "VAN-01",
          model: "Eicher Pro 2049",
          licensePlate: "MH02 EF 9012",
          maxCapacityKg: 3500,
          odometer: 12500,
          status: "IN_SHOP",
          vehicleType: "VAN",
          region: "Mumbai",
        },
      }),
      prisma.vehicle.create({
        data: {
          name: "VAN-02",
          model: "Mahindra Blazo",
          licensePlate: "MH43 GH 3456",
          maxCapacityKg: 4000,
          odometer: 32000,
          status: "AVAILABLE",
          vehicleType: "VAN",
          region: "Nashik",
        },
      }),
      prisma.vehicle.create({
        data: {
          name: "BIKE-01",
          model: "Bajaj Boxer",
          licensePlate: "MH01 IJ 7890",
          maxCapacityKg: 150,
          odometer: 8900,
          status: "AVAILABLE",
          vehicleType: "BIKE",
          region: "Mumbai",
        },
      }),
    ]);
    vehicleIds = vehicles.map((v) => v.id);
    console.log("Vehicles seeded");
  } else {
    vehicleIds = (await prisma.vehicle.findMany({ select: { id: true } })).map((v) => v.id);
  }

  const existingTrips = await prisma.trip.count();
  if (existingTrips === 0 && vehicleIds.length >= 3 && driverIds.length >= 3) {
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    await prisma.trip.createMany({
      data: [
        {
          vehicleId: vehicleIds[0],
          driverId: driverIds[0],
          cargoWeightKg: 4500,
          status: "COMPLETED",
          origin: "Mumbai",
          destination: "Pune",
          startOdometer: 45000,
          endOdometer: 45200,
          completedAt: now,
        },
        {
          vehicleId: vehicleIds[0],
          driverId: driverIds[0],
          cargoWeightKg: 3200,
          status: "COMPLETED",
          origin: "Pune",
          destination: "Nashik",
          startOdometer: 44800,
          endOdometer: 45000,
          completedAt: lastMonth,
        },
        {
          vehicleId: vehicleIds[1],
          driverId: driverIds[1],
          cargoWeightKg: 2000,
          status: "DISPATCHED",
          origin: "Pune",
          destination: "Mumbai",
          startOdometer: 28000,
        },
        {
          vehicleId: vehicleIds[2],
          driverId: driverIds[2],
          cargoWeightKg: 1500,
          status: "DRAFT",
          origin: "Mumbai",
          destination: "Thane",
        },
        {
          vehicleId: vehicleIds[0],
          driverId: driverIds[0],
          cargoWeightKg: 1000,
          status: "CANCELLED",
          origin: "Mumbai",
          destination: "Goa",
        },
      ],
    });
    console.log("Trips seeded");
  }

  const existingFuel = await prisma.fuelLog.count();
  if (existingFuel === 0 && vehicleIds.length > 0) {
    const trips = await prisma.trip.findMany({ where: { status: "COMPLETED" }, select: { id: true, vehicleId: true, completedAt: true } });
    const d = new Date();
    const months = [
      new Date(d.getFullYear(), d.getMonth() - 2, 15),
      new Date(d.getFullYear(), d.getMonth() - 1, 10),
      new Date(d.getFullYear(), d.getMonth(), 5),
    ];
    const fuelData: { vehicleId: number; tripId: number | null; liters: number; cost: number; date: Date }[] = [];
    for (const t of trips) {
      fuelData.push({
        vehicleId: t.vehicleId,
        tripId: t.id,
        liters: 120,
        cost: 12000,
        date: t.completedAt ?? new Date(),
      });
    }
    for (let i = 0; i < vehicleIds.length && i < 4; i++) {
      for (const m of months) {
        fuelData.push({
          vehicleId: vehicleIds[i],
          tripId: null,
          liters: 80 + i * 15,
          cost: 8000 + i * 1500,
          date: m,
        });
      }
    }
    await prisma.fuelLog.createMany({ data: fuelData });
    console.log("Fuel logs seeded");
  }

  const existingMaint = await prisma.maintenanceLog.count();
  if (existingMaint === 0 && vehicleIds.length > 0) {
    const baseDate = new Date();
    await prisma.maintenanceLog.createMany({
      data: [
        { vehicleId: vehicleIds[0], description: "Oil change and filter", serviceType: "Scheduled", cost: 4500 },
        { vehicleId: vehicleIds[0], description: "Brake pad replacement", serviceType: "Repair", cost: 8200 },
        { vehicleId: vehicleIds[1], description: "Tyre rotation", serviceType: "Scheduled", cost: 1200 },
        { vehicleId: vehicleIds[2], description: "Engine check and diagnostics", serviceType: "Repair", cost: 3500 },
        { vehicleId: vehicleIds[2], description: "Battery replacement", serviceType: "Repair", cost: 6000 },
        { vehicleId: vehicleIds[3], description: "General service", serviceType: "Scheduled", cost: 2800 },
      ],
    });
    console.log("Maintenance logs seeded");
  }

  const existingShipments = await prisma.shipment.count();
  if (existingShipments === 0) {
    await prisma.shipment.createMany({
      data: [
        { cargoWeightKg: 1200, status: "PENDING_ASSIGNMENT" },
        { cargoWeightKg: 800, status: "PENDING_ASSIGNMENT" },
        { cargoWeightKg: 2500, status: "PENDING_ASSIGNMENT" },
      ],
    });
    console.log("Shipments seeded");
  }

  const existingStats = await prisma.fleetStats.findFirst();
  if (!existingStats) {
    const [onTrip, inShop, total, pending] = await Promise.all([
      prisma.vehicle.count({ where: { status: "ON_TRIP", retired: false } }),
      prisma.vehicle.count({ where: { status: "IN_SHOP", retired: false } }),
      prisma.vehicle.count({ where: { retired: false } }),
      prisma.shipment.count({ where: { status: "PENDING_ASSIGNMENT" } }),
    ]);
    const utilization = total > 0 ? Math.round(((onTrip + inShop) / total) * 10000) / 100 : 0;
    await prisma.fleetStats.create({
      data: {
        activeFleetCount: onTrip,
        maintenanceAlertsCount: inShop,
        utilizationRatePct: utilization,
        pendingCargoCount: pending,
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
