import prisma from "../../config/prisma";

export class AnalyticsService {
  /** Fuel efficiency: km / L per vehicle (from completed trips + fuel logs) */
  async getFuelEfficiencyByVehicle(vehicleId: number): Promise<{ kmPerL: number; totalKm: number; totalLiters: number } | null> {
    const trips = await prisma.trip.findMany({
      where: { vehicleId, status: "COMPLETED", endOdometer: { not: null }, startOdometer: { not: null } },
    });
    let totalKm = 0;
    for (const t of trips) {
      if (t.startOdometer != null && t.endOdometer != null) totalKm += t.endOdometer - t.startOdometer;
    }
    const fuelAgg = await prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { liters: true } });
    const totalLiters = fuelAgg._sum.liters ?? 0;
    const kmPerL = totalLiters > 0 ? totalKm / totalLiters : 0;
    return { kmPerL, totalKm, totalLiters };
  }

  /** Vehicle ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost. We don't have Revenue/Acquisition in schema - returning cost summary. */
  async getVehicleROISummary(vehicleId: number) {
    const [fuelSum, maintenanceSum] = await Promise.all([
      prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
      prisma.maintenanceLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
    ]);
    const maintenance = maintenanceSum._sum.cost ?? 0;
    const fuel = fuelSum._sum.cost ?? 0;
    return {
      vehicleId,
      totalFuelCost: fuel,
      totalMaintenanceCost: maintenance,
      totalOperationalCost: fuel + maintenance,
      note: "Add acquisitionCost and revenue fields to schema for full ROI formula",
    };
  }

  async getMonthlyFuelSummary(vehicleId?: number) {
    const where = vehicleId ? { vehicleId } : {};
    const logs = await prisma.fuelLog.findMany({
      where,
      orderBy: { date: "asc" },
    });
    const byMonth: Record<string, { liters: number; cost: number }> = {};
    for (const log of logs) {
      const key = `${log.date.getFullYear()}-${String(log.date.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { liters: 0, cost: 0 };
      byMonth[key].liters += log.liters;
      byMonth[key].cost += log.cost;
    }
    return byMonth;
  }

  async getDriverSafetySummary() {
    return prisma.driver.findMany({
      select: {
        id: true,
        name: true,
        licenseExpiry: true,
        safetyScore: true,
        tripCompletionRate: true,
        status: true,
        _count: { select: { trips: true } },
      },
    });
  }
}
