import type { Request, Response } from "express";
import { z } from "zod";
import { FuelService } from "../services/FuelService";
import { sendSuccess, sendError, zodErrorToMessage } from "../utils/response";

const fuelService = new FuelService();

const createSchema = z.object({
  vehicleId: z.number().int().positive(),
  tripId: z.number().int().positive().optional(),
  liters: z.number().positive(),
  cost: z.number().min(0),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
});

export class FuelController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const body = createSchema.parse(req.body);
      const date = new Date(body.date);
      const log = await fuelService.create({ ...body, date });
      sendSuccess(res, log, "Fuel log added", 201);
    } catch (e) {
      if (e instanceof z.ZodError) {
        sendError(res, zodErrorToMessage(e), 400);
        return;
      }
      sendError(res, e instanceof Error ? e.message : "Create failed", 400);
    }
  }

  async listByVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        sendError(res, "Invalid vehicle id", 400);
        return;
      }
      const list = await fuelService.listByVehicle(vehicleId);
      sendSuccess(res, list);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to list fuel logs", 500);
    }
  }

  async getOperationalCost(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        sendError(res, "Invalid vehicle id", 400);
        return;
      }
      const result = await fuelService.getOperationalCostByVehicle(vehicleId);
      sendSuccess(res, result);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to get cost", 500);
    }
  }

  async getCostPerKm(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        sendError(res, "Invalid vehicle id", 400);
        return;
      }
      const result = await fuelService.getCostPerKm(vehicleId);
      sendSuccess(res, result ?? { costPerKm: 0, totalCost: 0, totalKm: 0 });
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to get cost per km", 500);
    }
  }
}
