import prisma from "../../config/prisma";

export interface CreateFuelLogInput {
  vehicleId: number;
  tripId?: number;
  liters: number;
  cost: number;
  date: Date;
}

export class FuelService {
  async create(input: CreateFuelLogInput) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw new Error("Vehicle not found");
    return prisma.fuelLog.create({
      data: {
        vehicleId: input.vehicleId,
        tripId: input.tripId ?? null,
        liters: input.liters,
        cost: input.cost,
        date: input.date,
      },
    });
  }

  async listByVehicle(vehicleId: number) {
    return prisma.fuelLog.findMany({
      where: { vehicleId },
      orderBy: { date: "desc" },
      include: { trip: true },
    });
  }

  /** Total operational cost (fuel + maintenance) per vehicle */
  async getOperationalCostByVehicle(vehicleId: number) {
    const [fuelTotal, maintenanceTotal] = await Promise.all([
      prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
      prisma.maintenanceLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
    ]);
    const fuel = fuelTotal._sum.cost ?? 0;
    const maintenance = maintenanceTotal._sum.cost ?? 0;
    return { vehicleId, fuelCost: fuel, maintenanceCost: maintenance, totalOperationalCost: fuel + maintenance };
  }

  /** Cost per km for a vehicle (from fuel logs and trip odometer delta) */
  async getCostPerKm(vehicleId: number): Promise<{ costPerKm: number; totalCost: number; totalKm: number } | null> {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return null;
    const trips = await prisma.trip.findMany({
      where: { vehicleId, status: "COMPLETED", endOdometer: { not: null }, startOdometer: { not: null } },
    });
    let totalKm = 0;
    for (const t of trips) {
      if (t.startOdometer != null && t.endOdometer != null) totalKm += t.endOdometer - t.startOdometer;
    }
    const fuelAgg = await prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { cost: true } });
    const totalCost = fuelAgg._sum.cost ?? 0;
    const costPerKm = totalKm > 0 ? totalCost / totalKm : 0;
    return { costPerKm, totalCost, totalKm };
  }
}
