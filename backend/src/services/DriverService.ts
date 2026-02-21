import prisma from "../../config/prisma";
import type { DriverStatus } from "@prisma/client";

export interface CreateDriverInput {
  name: string;
  licenseNumber: string;
  licenseExpiry: Date;
  licenseCategory: string;
  userId?: number;
}

export interface UpdateDriverInput {
  name?: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
  licenseCategory?: string;
  status?: DriverStatus;
  safetyScore?: number;
  tripCompletionRate?: number;
}

export class DriverService {
  /** Drivers available for assignment (ON_DUTY, license not expired) */
  async listAvailableForAssignment(licenseCategory?: string) {
    const now = new Date();
    const where: Record<string, unknown> = {
      status: "ON_DUTY",
      licenseExpiry: { gt: now },
    };
    if (licenseCategory) where.licenseCategory = licenseCategory;
    return prisma.driver.findMany({ where, orderBy: { name: "asc" } });
  }

  async list(filters?: { status?: DriverStatus }) {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    return prisma.driver.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { trips: true } }, user: { select: { email: true } } },
    });
  }

  async getById(id: number) {
    const d = await prisma.driver.findUnique({
      where: { id },
      include: { _count: { select: { trips: true } }, user: true },
    });
    if (!d) throw new Error("Driver not found");
    return d;
  }

  /** Returns true if driver can be assigned (license valid, status ON_DUTY) */
  async canAssign(driverId: number): Promise<{ ok: boolean; reason?: string }> {
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) return { ok: false, reason: "Driver not found" };
    if (driver.status !== "ON_DUTY") return { ok: false, reason: "Driver is not on duty" };
    if (driver.licenseExpiry <= new Date()) return { ok: false, reason: "Driver license expired" };
    return { ok: true };
  }

  async create(data: CreateDriverInput) {
    return prisma.driver.create({
      data: {
        name: data.name,
        licenseNumber: data.licenseNumber,
        licenseExpiry: data.licenseExpiry,
        licenseCategory: data.licenseCategory,
        userId: data.userId ?? null,
      },
    });
  }

  async update(id: number, data: UpdateDriverInput) {
    await this.getById(id);
    return prisma.driver.update({ where: { id }, data });
  }

  async updateStatus(id: number, status: DriverStatus) {
    return this.update(id, { status });
  }

  async recalcTripCompletionRate(driverId: number) {
    const [completed, total] = await Promise.all([
      prisma.trip.count({ where: { driverId, status: "COMPLETED" } }),
      prisma.trip.count({ where: { driverId, status: { not: "CANCELLED" } } }),
    ]);
    const rate = total > 0 ? (completed / total) * 100 : 0;
    await prisma.driver.update({ where: { id: driverId }, data: { tripCompletionRate: rate } });
    return rate;
  }
}
