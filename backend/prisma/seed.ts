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
      prisma.vehicle.create({ data: { name: "TRK-01", model: "Ashok Leyland 3718", licensePlate: "MH12 AB 1234", maxCapacityKg: 9000, odometer: 45200, status: "ON_TRIP", vehicleType: "TRUCK", region: "Mumbai" } }),
      prisma.vehicle.create({ data: { name: "TRK-02", model: "Tata Signa", licensePlate: "MH14 CD 5678", maxCapacityKg: 7500, odometer: 28100, status: "AVAILABLE", vehicleType: "TRUCK", region: "Pune" } }),
      prisma.vehicle.create({ data: { name: "TRK-03", model: "BharatBenz 3128", licensePlate: "MH31 KL 1111", maxCapacityKg: 8000, odometer: 52000, status: "AVAILABLE", vehicleType: "TRUCK", region: "Nashik" } }),
      prisma.vehicle.create({ data: { name: "VAN-01", model: "Eicher Pro 2049", licensePlate: "MH02 EF 9012", maxCapacityKg: 3500, odometer: 12500, status: "IN_SHOP", vehicleType: "VAN", region: "Mumbai" } }),
      prisma.vehicle.create({ data: { name: "VAN-02", model: "Mahindra Blazo", licensePlate: "MH43 GH 3456", maxCapacityKg: 4000, odometer: 32000, status: "AVAILABLE", vehicleType: "VAN", region: "Nashik" } }),
      prisma.vehicle.create({ data: { name: "VAN-03", model: "Tata Ultra", licensePlate: "MH12 MN 2222", maxCapacityKg: 3000, odometer: 18500, status: "AVAILABLE", vehicleType: "VAN", region: "Mumbai" } }),
      prisma.vehicle.create({ data: { name: "VAN-04", model: "Ashok Leyland Dost", licensePlate: "MH14 PQ 3333", maxCapacityKg: 2500, odometer: 42000, status: "ON_TRIP", vehicleType: "VAN", region: "Pune" } }),
      prisma.vehicle.create({ data: { name: "VAN-05", model: "Eicher Pro 3015", licensePlate: "MH02 RS 4444", maxCapacityKg: 3500, odometer: 29800, status: "AVAILABLE", vehicleType: "VAN", region: "Mumbai" } }),
      prisma.vehicle.create({ data: { name: "BIKE-01", model: "Bajaj Boxer", licensePlate: "MH01 IJ 7890", maxCapacityKg: 150, odometer: 8900, status: "AVAILABLE", vehicleType: "BIKE", region: "Mumbai" } }),
      prisma.vehicle.create({ data: { name: "BIKE-02", model: "Hero Splendor", licensePlate: "MH43 TU 5555", maxCapacityKg: 120, odometer: 15600, status: "AVAILABLE", vehicleType: "BIKE", region: "Nashik" } }),
    ]);
    vehicleIds = vehicles.map((v) => v.id);
    console.log("Vehicles seeded");
  } else {
    vehicleIds = (await prisma.vehicle.findMany({ select: { id: true } })).map((v) => v.id);
  }

  const existingTrips = await prisma.trip.count();
  if (existingTrips === 0 && vehicleIds.length >= 3 && driverIds.length >= 3) {
    const now = new Date();
    const completedDates: Date[] = [];
    for (let m = -5; m <= 0; m++) {
      const d = new Date(now);
      d.setMonth(d.getMonth() + m);
      d.setDate(5 + (m + 5) * 3);
      completedDates.push(d);
    }
    const base = [
      { v: 0, d: 0, cargo: 4500, origin: "Mumbai", dest: "Pune", startOdo: 45000, endOdo: 45200, completedAt: completedDates[5] },
      { v: 0, d: 0, cargo: 3200, origin: "Pune", dest: "Nashik", startOdo: 44800, endOdo: 45000, completedAt: completedDates[4] },
      { v: 0, d: 0, cargo: 2800, origin: "Nashik", dest: "Mumbai", startOdo: 44600, endOdo: 44800, completedAt: completedDates[3] },
      { v: 1, d: 1, cargo: 2000, origin: "Pune", dest: "Mumbai", startOdo: 27800, endOdo: 28100, completedAt: completedDates[4] },
      { v: 1, d: 1, cargo: 3500, origin: "Mumbai", dest: "Pune", startOdo: 27500, endOdo: 27800, completedAt: completedDates[2] },
      { v: 2, d: 0, cargo: 5000, origin: "Nashik", dest: "Mumbai", startOdo: 51800, endOdo: 52000, completedAt: completedDates[5] },
      { v: 3, d: 2, cargo: 1200, origin: "Mumbai", dest: "Thane", startOdo: 12200, endOdo: 12500, completedAt: completedDates[3] },
      { v: 4, d: 1, cargo: 1800, origin: "Nashik", dest: "Pune", startOdo: 31800, endOdo: 32000, completedAt: completedDates[1] },
      { v: 5, d: 0, cargo: 2200, origin: "Mumbai", dest: "Pune", startOdo: 18200, endOdo: 18500, completedAt: completedDates[0] },
      { v: 6, d: 2, cargo: 1500, origin: "Pune", dest: "Mumbai", startOdo: 41800, endOdo: 42000, completedAt: completedDates[2] },
    ];
    for (const row of base) {
      await prisma.trip.create({
        data: {
          vehicleId: vehicleIds[row.v],
          driverId: driverIds[row.d],
          cargoWeightKg: row.cargo,
          status: "COMPLETED",
          origin: row.origin,
          destination: row.dest,
          startOdometer: row.startOdo,
          endOdometer: row.endOdo,
          completedAt: row.completedAt,
        },
      });
    }
    await prisma.trip.createMany({
      data: [
        { vehicleId: vehicleIds[1], driverId: driverIds[1], cargoWeightKg: 2500, status: "DISPATCHED", origin: "Pune", destination: "Mumbai", startOdometer: 28000 },
        { vehicleId: vehicleIds[3], driverId: driverIds[2], cargoWeightKg: 1500, status: "DRAFT", origin: "Mumbai", destination: "Thane" },
        { vehicleId: vehicleIds[0], driverId: driverIds[0], cargoWeightKg: 1000, status: "CANCELLED", origin: "Mumbai", destination: "Goa" },
      ],
    });
    console.log("Trips seeded");
  }

  const existingFuel = await prisma.fuelLog.count();
  if (existingFuel === 0 && vehicleIds.length > 0) {
    const trips = await prisma.trip.findMany({ where: { status: "COMPLETED" }, select: { id: true, vehicleId: true, completedAt: true } });
    const fuelData: { vehicleId: number; tripId: number | null; liters: number; cost: number; date: Date }[] = [];
    for (const t of trips) {
      fuelData.push({
        vehicleId: t.vehicleId,
        tripId: t.id,
        liters: 100 + Math.floor(Math.random() * 60),
        cost: 10000 + Math.floor(Math.random() * 6000),
        date: t.completedAt ?? new Date(),
      });
    }
    const now = new Date();
    for (let monthOffset = -11; monthOffset <= 0; monthOffset++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 10);
      for (let vi = 0; vi < Math.min(vehicleIds.length, 8); vi++) {
        fuelData.push({
          vehicleId: vehicleIds[vi],
          tripId: null,
          liters: 70 + vi * 12 + (monthOffset % 3) * 15,
          cost: 7000 + vi * 1200 + (monthOffset % 2) * 2000,
          date: monthDate,
        });
      }
    }
    await prisma.fuelLog.createMany({ data: fuelData });
    console.log("Fuel logs seeded");
  }

  const existingMaint = await prisma.maintenanceLog.count();
  if (existingMaint === 0 && vehicleIds.length > 0) {
    const baseDate = new Date();
    const services = [
      { desc: "Oil change and filter", type: "Scheduled", cost: 4500 },
      { desc: "Brake pad replacement", type: "Repair", cost: 8200 },
      { desc: "Tyre rotation", type: "Scheduled", cost: 1200 },
      { desc: "Engine check and diagnostics", type: "Repair", cost: 3500 },
      { desc: "Battery replacement", type: "Repair", cost: 6000 },
      { desc: "General service", type: "Scheduled", cost: 2800 },
      { desc: "AC service", type: "Scheduled", cost: 1800 },
      { desc: "Wheel alignment", type: "Repair", cost: 2200 },
      { desc: "Clutch replacement", type: "Repair", cost: 9500 },
      { desc: "Suspension check", type: "Scheduled", cost: 1500 },
    ];
    for (let vi = 0; vi < Math.min(vehicleIds.length, 8); vi++) {
      for (let m = -6; m <= 0; m++) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + m, 5 + vi);
        const svc = services[(vi + m + 10) % services.length];
        await prisma.maintenanceLog.create({
          data: {
            vehicleId: vehicleIds[vi],
            description: svc.desc,
            serviceType: svc.type,
            cost: svc.cost + (m % 2) * 500,
            createdAt: d,
          },
        });
      }
    }
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
