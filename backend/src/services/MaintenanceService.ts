import prisma from "../../config/prisma";
import { StatsService } from "./StatsService";

const statsService = new StatsService();

export interface CreateMaintenanceLogInput {
  vehicleId: number;
  description: string;
  serviceType?: string;
  cost?: number;
}

export class MaintenanceService {
  /** Adding a vehicle to a service log sets status to IN_SHOP (removes from dispatcher pool) */
  async create(input: CreateMaintenanceLogInput) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw new Error("Vehicle not found");
    const log = await prisma.$transaction(async (tx) => {
      const l = await tx.maintenanceLog.create({
        data: {
          vehicleId: input.vehicleId,
          description: input.description,
          serviceType: input.serviceType ?? null,
          cost: input.cost ?? null,
        },
      });
      await tx.vehicle.update({
        where: { id: input.vehicleId },
        data: { status: "IN_SHOP" },
      });
      return l;
    });
    await statsService.refresh();
    return log;
  }

  /** When vehicle is released from shop, set back to AVAILABLE */
  async releaseVehicle(vehicleId: number) {
    const v = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!v) throw new Error("Vehicle not found");
    if (v.status !== "IN_SHOP") throw new Error("Vehicle is not in shop");
    await prisma.vehicle.update({ where: { id: vehicleId }, data: { status: "AVAILABLE" } });
    await statsService.refresh();
    return prisma.vehicle.findUnique({ where: { id: vehicleId } });
  }

  async listByVehicle(vehicleId: number) {
    return prisma.maintenanceLog.findMany({
      where: { vehicleId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listAll(filters?: { vehicleId?: number }) {
    const where = filters?.vehicleId ? { vehicleId: filters.vehicleId } : {};
    return prisma.maintenanceLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { vehicle: true },
    });
  }
}
