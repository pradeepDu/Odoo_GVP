import prisma from "../../config/prisma";
import type { TripStatus } from "@prisma/client";
import { VehicleService } from "./VehicleService";
import { DriverService } from "./DriverService";
import { StatsService } from "./StatsService";

const vehicleService = new VehicleService();
const driverService = new DriverService();
const statsService = new StatsService();

export interface CreateTripInput {
  vehicleId: number;
  driverId: number;
  cargoWeightKg: number;
  origin?: string;
  destination?: string;
}

export class TripService {
  /** Validate: cargo weight <= vehicle max capacity; driver assignable */
  async validateCreate(input: CreateTripInput): Promise<{ ok: boolean; error?: string }> {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) return { ok: false, error: "Vehicle not found" };
    if (vehicle.retired || vehicle.status !== "AVAILABLE") {
      return { ok: false, error: "Vehicle is not available for dispatch" };
    }
    if (input.cargoWeightKg > vehicle.maxCapacityKg) {
      return { ok: false, error: `Cargo weight (${input.cargoWeightKg} kg) exceeds vehicle capacity (${vehicle.maxCapacityKg} kg)` };
    }
    const driverCheck = await driverService.canAssign(input.driverId);
    if (!driverCheck.ok) return { ok: false, error: driverCheck.reason };
    return { ok: true };
  }

  async create(input: CreateTripInput) {
    const validation = await this.validateCreate(input);
    if (!validation.ok) throw new Error(validation.error);
    const trip = await prisma.$transaction(async (tx) => {
      const t = await tx.trip.create({
        data: {
          vehicleId: input.vehicleId,
          driverId: input.driverId,
          cargoWeightKg: input.cargoWeightKg,
          origin: input.origin ?? null,
          destination: input.destination ?? null,
          status: "DRAFT",
        },
      });
      await tx.vehicle.update({ where: { id: input.vehicleId }, data: { status: "ON_TRIP" } });
      await tx.driver.update({ where: { id: input.driverId }, data: { status: "ON_DUTY" } });
      return t;
    });
    await statsService.refresh();
    return trip;
  }

  async dispatch(tripId: number) {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error("Trip not found");
    if (trip.status !== "DRAFT") throw new Error("Only draft trips can be dispatched");
    return prisma.trip.update({
      where: { id: tripId },
      data: { status: "DISPATCHED" },
    });
  }

  async complete(tripId: number, endOdometer: number) {
    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { vehicle: true } });
    if (!trip) throw new Error("Trip not found");
    if (trip.status !== "DISPATCHED" && trip.status !== "DRAFT") throw new Error("Trip cannot be completed");
    await prisma.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id: tripId },
        data: { status: "COMPLETED", endOdometer, completedAt: new Date() },
      });
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "AVAILABLE", odometer: endOdometer },
      });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "ON_DUTY" } });
    });
    await driverService.recalcTripCompletionRate(trip.driverId);
    await statsService.refresh();
    return prisma.trip.findUnique({ where: { id: tripId }, include: { vehicle: true, driver: true } });
  }

  async cancel(tripId: number) {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error("Trip not found");
    if (trip.status === "COMPLETED") throw new Error("Completed trip cannot be cancelled");
    await prisma.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id: tripId },
        data: { status: "CANCELLED" },
      });
      if (trip.status === "DISPATCHED" || trip.status === "DRAFT") {
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: "AVAILABLE" },
        });
        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: "ON_DUTY" },
        });
      }
    });
    await driverService.recalcTripCompletionRate(trip.driverId);
    await statsService.refresh();
    return prisma.trip.findUnique({ where: { id: tripId } });
  }

  async list(filters?: { status?: TripStatus; vehicleId?: number; driverId?: number }) {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters?.driverId) where.driverId = filters.driverId;
    return prisma.trip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { vehicle: true, driver: true },
    });
  }

  async getById(id: number) {
    const t = await prisma.trip.findUnique({
      where: { id },
      include: { vehicle: true, driver: true, fuelLogs: true },
    });
    if (!t) throw new Error("Trip not found");
    return t;
  }
}
