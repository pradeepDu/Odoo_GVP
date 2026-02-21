import type { Request, Response } from "express";
import { z } from "zod";
import { MaintenanceService } from "../services/MaintenanceService";
import { sendSuccess, sendError, zodErrorToMessage } from "../utils/response";

const maintenanceService = new MaintenanceService();

const createSchema = z.object({
  vehicleId: z.number().int().positive(),
  description: z.string().min(1),
  serviceType: z.string().optional(),
  cost: z.number().min(0).optional(),
});

export class MaintenanceController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;
      const list = await maintenanceService.listAll({ vehicleId });
      sendSuccess(res, list);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to list maintenance logs", 500);
    }
  }

  async listByVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        sendError(res, "Invalid vehicle id", 400);
        return;
      }
      const list = await maintenanceService.listByVehicle(vehicleId);
      sendSuccess(res, list);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to list logs", 500);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const body = createSchema.parse(req.body);
      const log = await maintenanceService.create(body);
      sendSuccess(res, log, "Maintenance log added", 201);
    } catch (e) {
      if (e instanceof z.ZodError) {
        sendError(res, zodErrorToMessage(e), 400);
        return;
      }
      sendError(res, e instanceof Error ? e.message : "Create failed", 400);
    }
  }

  async releaseVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        sendError(res, "Invalid vehicle id", 400);
        return;
      }
      const vehicle = await maintenanceService.releaseVehicle(vehicleId);
      sendSuccess(res, vehicle, "Vehicle released from maintenance");
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Release failed", 400);
    }
  }
}
