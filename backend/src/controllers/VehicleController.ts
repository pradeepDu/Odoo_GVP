import type { Request, Response } from "express";
import { z } from "zod";
import { VehicleService } from "../services/VehicleService";
import { sendSuccess, sendError, zodErrorToMessage } from "../utils/response";

const vehicleService = new VehicleService();

const createSchema = z.object({
  name: z.string().min(1),
  model: z.string().optional(),
  licensePlate: z.string().min(1),
  maxCapacityKg: z.number().positive(),
  odometer: z.number().min(0).optional(),
  vehicleType: z.enum(["TRUCK", "VAN", "BIKE"]),
  region: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  model: z.string().optional(),
  maxCapacityKg: z.number().positive().optional(),
  odometer: z.number().min(0).optional(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "IN_SHOP", "OUT_OF_SERVICE"]).optional(),
  region: z.string().optional(),
  retired: z.boolean().optional(),
});

export class VehicleController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleType, status, region, retired } = req.query;
      const filters =
        vehicleType || status || region || retired !== undefined
          ? {
              vehicleType: vehicleType as "TRUCK" | "VAN" | "BIKE" | undefined,
              status: status as "AVAILABLE" | "ON_TRIP" | "IN_SHOP" | "OUT_OF_SERVICE" | undefined,
              region: region as string | undefined,
              retired: retired === "true" ? true : retired === "false" ? false : undefined,
            }
          : undefined;
      const list = await vehicleService.list(filters);
      sendSuccess(res, list);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to list vehicles", 500);
    }
  }

  async listAvailable(req: Request, res: Response): Promise<void> {
    try {
      const vehicleType = req.query.vehicleType as "TRUCK" | "VAN" | "BIKE" | undefined;
      const list = await vehicleService.listAvailableForDispatch(vehicleType);
      sendSuccess(res, list);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to list available vehicles", 500);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        sendError(res, "Invalid vehicle id", 400);
        return;
      }
      const vehicle = await vehicleService.getById(id);
      sendSuccess(res, vehicle);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Vehicle not found", 404);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const body = createSchema.parse(req.body);
      const vehicle = await vehicleService.create(body);
      sendSuccess(res, vehicle, "Vehicle added", 201);
    } catch (e) {
      if (e instanceof z.ZodError) {
        sendError(res, zodErrorToMessage(e), 400);
        return;
      }
      sendError(res, e instanceof Error ? e.message : "Create failed", 400);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        sendError(res, "Invalid vehicle id", 400);
        return;
      }
      const body = updateSchema.parse(req.body);
      const vehicle = await vehicleService.update(id, body);
      sendSuccess(res, vehicle, "Vehicle updated");
    } catch (e) {
      if (e instanceof z.ZodError) {
        sendError(res, zodErrorToMessage(e), 400);
        return;
      }
      sendError(res, e instanceof Error ? e.message : "Update failed", 400);
    }
  }

  async setOutOfService(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const retired = req.body.retired === true;
      if (Number.isNaN(id)) {
        sendError(res, "Invalid vehicle id", 400);
        return;
      }
      const vehicle = await vehicleService.setOutOfService(id, retired);
      sendSuccess(res, vehicle, retired ? "Vehicle retired" : "Vehicle restored");
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Update failed", 400);
    }
  }
}
