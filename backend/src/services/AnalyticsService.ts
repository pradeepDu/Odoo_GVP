import prisma from "../../config/prisma";
import { DriverService } from "./DriverService";

const driverService = new DriverService();

export class AnalyticsService {
  /** Fuel efficiency: km/L per vehicle from completed trips (odometer delta) and fuel logs (liters). Same data as Trip complete + FuelExpense. */
  async getFuelEfficiencyByVehicle(vehicleId: number): Promise<{
    vehicleId: number;
    vehicleName: string;
    kmPerL: number;
    totalKm: number;
    totalLiters: number;
    completedTripsCount: number;
    fuelLogsCount: number;
  }> {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { name: true } });
    if (!vehicle) throw new Error("Vehicle not found");

    const trips = await prisma.trip.findMany({
      where: { vehicleId, status: "COMPLETED", endOdometer: { not: null }, startOdometer: { not: null } },
    });
    let totalKm = 0;
    for (const t of trips) {
      if (t.startOdometer != null && t.endOdometer != null) totalKm += t.endOdometer - t.startOdometer;
    }

    const [fuelAgg, fuelCount] = await Promise.all([
      prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { liters: true } }),
      prisma.fuelLog.count({ where: { vehicleId } }),
    ]);
    const totalLiters = fuelAgg._sum.liters ?? 0;
    const kmPerL = totalLiters > 0 ? Math.round((totalKm / totalLiters) * 100) / 100 : 0;

    return {
      vehicleId,
      vehicleName: vehicle.name,
      kmPerL,
      totalKm: Math.round(totalKm * 100) / 100,
      totalLiters: Math.round(totalLiters * 100) / 100,
      completedTripsCount: trips.length,
      fuelLogsCount: fuelCount,
    };
  }

  /** Vehicle cost summary (Fuel + Maintenance) for selected vehicle. Same relations as FuelExpense operational cost & Maintenance logs. */
  async getVehicleROISummary(vehicleId: number) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { name: true, licensePlate: true } });
    if (!vehicle) throw new Error("Vehicle not found");

    const [fuelSum, maintenanceSum, fuelLogsCount, maintenanceLogsCount] = await Promise.all([
      prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { cost: true, liters: true } }),
      prisma.maintenanceLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
      prisma.fuelLog.count({ where: { vehicleId } }),
      prisma.maintenanceLog.count({ where: { vehicleId } }),
    ]);
    const totalFuelCost = fuelSum._sum.cost ?? 0;
    const totalMaintenanceCost = maintenanceSum._sum.cost ?? 0;
    const totalOperationalCost = totalFuelCost + totalMaintenanceCost;
    const totalLiters = fuelSum._sum.liters ?? 0;

    return {
      vehicleId,
      vehicleName: vehicle.name,
      licensePlate: vehicle.licensePlate,
      totalFuelCost: Math.round(totalFuelCost * 100) / 100,
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      totalOperationalCost: Math.round(totalOperationalCost * 100) / 100,
      totalLiters: Math.round(totalLiters * 100) / 100,
      fuelLogsCount,
      maintenanceLogsCount,
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

  /** Top N vehicles by total operational cost (fuel + maintenance). DB-driven. */
  async getTopCostliestVehicles(limit = 5) {
    const vehicles = await prisma.vehicle.findMany({
      where: { retired: false },
      select: { id: true, name: true },
    });
    const withCost: { vehicleId: number; vehicleName: string; totalOperationalCost: number }[] = [];
    for (const v of vehicles) {
      const [fuelSum, maintSum] = await Promise.all([
        prisma.fuelLog.aggregate({ where: { vehicleId: v.id }, _sum: { cost: true } }),
        prisma.maintenanceLog.aggregate({ where: { vehicleId: v.id }, _sum: { cost: true } }),
      ]);
      const total = (fuelSum._sum.cost ?? 0) + (maintSum._sum.cost ?? 0);
      withCost.push({ vehicleId: v.id, vehicleName: v.name, totalOperationalCost: Math.round(total * 100) / 100 });
    }
    withCost.sort((a, b) => b.totalOperationalCost - a.totalOperationalCost);
    return withCost.slice(0, limit);
  }

  /** Monthly maintenance cost grouped by month. Optional vehicleId filter. */
  async getMonthlyMaintenanceSummary(vehicleId?: number) {
    const where = vehicleId ? { vehicleId } : {};
    const logs = await prisma.maintenanceLog.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
    const byMonth: Record<string, { cost: number }> = {};
    for (const log of logs) {
      const d = log.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { cost: 0 };
      byMonth[key].cost += log.cost ?? 0;
    }
    return byMonth;
  }

  /** Monthly financial summary: fuel + maintenance by month (no revenue in schema). */
  async getMonthlyFinancialSummary(vehicleId?: number) {
    const [fuelByMonth, maintByMonth] = await Promise.all([
      this.getMonthlyFuelSummary(vehicleId),
      this.getMonthlyMaintenanceSummary(vehicleId),
    ]);
    const months = new Set([...Object.keys(fuelByMonth), ...Object.keys(maintByMonth)]);
    const rows: { month: string; fuelCost: number; maintenanceCost: number; totalCost: number }[] = [];
    for (const month of [...months].sort()) {
      const fuel = fuelByMonth[month] ?? { liters: 0, cost: 0 };
      const maint = maintByMonth[month] ?? { cost: 0 };
      const totalCost = fuel.cost + maint.cost;
      rows.push({
        month,
        fuelCost: Math.round(fuel.cost * 100) / 100,
        maintenanceCost: Math.round(maint.cost * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
      });
    }
    return rows.sort((a, b) => a.month.localeCompare(b.month));
  }

  /** Drivers with computed Completion Rate and Safety Score from trip data (same as Performance page). */
  async getDriverSafetySummary() {
    const drivers = await driverService.list({});
    return drivers.map((d) => ({
      id: d.id,
      name: d.name,
      licenseExpiry: d.licenseExpiry,
      safetyScore: d.safetyScore,
      tripCompletionRate: d.tripCompletionRate,
      status: d.status,
      _count: { trips: d._count.trips },
    }));
  }
}
