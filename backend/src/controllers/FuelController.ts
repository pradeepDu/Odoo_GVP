import type { Request, Response } from "express";
import { FuelService } from "../services/FuelService";
import { z } from "zod";

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
      res.status(201).json(log);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: e.errors });
        return;
      }
      res.status(400).json({ error: e instanceof Error ? e.message : "Create failed" });
    }
  }

  async listByVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        res.status(400).json({ error: "Invalid vehicle id" });
        return;
      }
      const list = await fuelService.listByVehicle(vehicleId);
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed to list fuel logs" });
    }
  }

  async getOperationalCost(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        res.status(400).json({ error: "Invalid vehicle id" });
        return;
      }
      const result = await fuelService.getOperationalCostByVehicle(vehicleId);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed to get cost" });
    }
  }

  async getCostPerKm(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        res.status(400).json({ error: "Invalid vehicle id" });
        return;
      }
      const result = await fuelService.getCostPerKm(vehicleId);
      res.json(result ?? { costPerKm: 0, totalCost: 0, totalKm: 0 });
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed to get cost per km" });
    }
  }
}
