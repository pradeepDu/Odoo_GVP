import type { Request, Response } from "express";
import { MaintenanceService } from "../services/MaintenanceService";
import { z } from "zod";

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
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed to list maintenance logs" });
    }
  }

  async listByVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        res.status(400).json({ error: "Invalid vehicle id" });
        return;
      }
      const list = await maintenanceService.listByVehicle(vehicleId);
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed to list logs" });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const body = createSchema.parse(req.body);
      const log = await maintenanceService.create(body);
      res.status(201).json(log);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: e.errors });
        return;
      }
      res.status(400).json({ error: e instanceof Error ? e.message : "Create failed" });
    }
  }

  async releaseVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        res.status(400).json({ error: "Invalid vehicle id" });
        return;
      }
      const vehicle = await maintenanceService.releaseVehicle(vehicleId);
      res.json(vehicle);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : "Release failed" });
    }
  }
}
