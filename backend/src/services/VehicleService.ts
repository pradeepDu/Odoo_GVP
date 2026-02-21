import prisma from "../../config/prisma";
import type { VehicleType, VehicleStatus } from "@prisma/client";

export interface CreateVehicleInput {
  name: string;
  model?: string;
  licensePlate: string;
  maxCapacityKg: number;
  odometer?: number;
  vehicleType: VehicleType;
  region?: string;
}

export interface UpdateVehicleInput {
  name?: string;
  model?: string;
  maxCapacityKg?: number;
  odometer?: number;
  status?: VehicleStatus;
  region?: string;
  retired?: boolean;
}

export class VehicleService {
  async list(filters?: { vehicleType?: VehicleType; status?: VehicleStatus; region?: string; retired?: boolean }) {
    const where: Record<string, unknown> = {};
    if (filters?.vehicleType) where.vehicleType = filters.vehicleType;
    if (filters?.status) where.status = filters.status;
    if (filters?.region) where.region = filters.region;
    if (filters?.retired !== undefined) where.retired = filters.retired;
    return prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { trips: true, maintenanceLogs: true } } },
    });
  }

  /** Vehicles available for dispatch (AVAILABLE, not retired) */
  async listAvailableForDispatch(vehicleType?: VehicleType) {
    const where: Record<string, unknown> = { status: "AVAILABLE", retired: false };
    if (vehicleType) where.vehicleType = vehicleType;
    return prisma.vehicle.findMany({ where, orderBy: { name: "asc" } });
  }

  async getById(id: number) {
    const v = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        _count: { select: { trips: true, maintenanceLogs: true, fuelLogs: true } },
        maintenanceLogs: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!v) throw new Error("Vehicle not found");
    return v;
  }

  async create(data: CreateVehicleInput) {
    const existing = await prisma.vehicle.findUnique({ where: { licensePlate: data.licensePlate } });
    if (existing) throw new Error("License plate already registered");
    return prisma.vehicle.create({
      data: {
        name: data.name,
        model: data.model ?? null,
        licensePlate: data.licensePlate,
        maxCapacityKg: data.maxCapacityKg,
        odometer: data.odometer ?? 0,
        vehicleType: data.vehicleType,
        region: data.region ?? null,
      },
    });
  }

  async update(id: number, data: UpdateVehicleInput) {
    await this.getById(id);
    return prisma.vehicle.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.model !== undefined && { model: data.model }),
        ...(data.maxCapacityKg !== undefined && { maxCapacityKg: data.maxCapacityKg }),
        ...(data.odometer !== undefined && { odometer: data.odometer }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.region !== undefined && { region: data.region }),
        ...(data.retired !== undefined && { retired: data.retired, status: data.retired ? "OUT_OF_SERVICE" : "AVAILABLE" }),
      },
    });
  }

  async setOutOfService(id: number, retired: boolean) {
    return this.update(id, { retired });
  }
}
