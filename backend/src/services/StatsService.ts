import prisma from "../../config/prisma";

export class StatsService {
  /** Compute KPIs and optionally persist to FleetStats for fast dashboard reads */
  async getDashboardKPIs() {
    const [activeFleet, inShop, totalActive, pendingCargo, totalVehicles] = await Promise.all([
      prisma.vehicle.count({ where: { status: "ON_TRIP", retired: false } }),
      prisma.vehicle.count({ where: { status: "IN_SHOP", retired: false } }),
      prisma.vehicle.count({ where: { retired: false } }),
      prisma.shipment.count({ where: { status: "PENDING_ASSIGNMENT" } }),
      prisma.vehicle.count({ where: { retired: false } }),
    ]);
    const assigned = activeFleet + inShop;
    const utilizationRatePct = totalVehicles > 0 ? (assigned / totalVehicles) * 100 : 0;
    return {
      activeFleetCount: activeFleet,
      maintenanceAlertsCount: inShop,
      utilizationRatePct: Math.round(utilizationRatePct * 100) / 100,
      pendingCargoCount: pendingCargo,
    };
  }

  async refresh() {
    const kpis = await this.getDashboardKPIs();
    const existing = await prisma.fleetStats.findFirst({ orderBy: { id: "desc" } });
    if (existing) {
      await prisma.fleetStats.update({
        where: { id: existing.id },
        data: { ...kpis },
      });
    } else {
      await prisma.fleetStats.create({ data: kpis });
    }
    return kpis;
  }
}
