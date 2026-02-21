import type { Request, Response } from "express";
import { VehicleService } from "../services/VehicleService";
import { z } from "zod";

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
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed to list vehicles" });
    }
  }

  async listAvailable(req: Request, res: Response): Promise<void> {
    try {
      const vehicleType = req.query.vehicleType as "TRUCK" | "VAN" | "BIKE" | undefined;
      const list = await vehicleService.listAvailableForDispatch(vehicleType);
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed to list available vehicles" });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid vehicle id" });
        return;
      }
      const vehicle = await vehicleService.getById(id);
      res.json(vehicle);
    } catch (e) {
      res.status(404).json({ error: e instanceof Error ? e.message : "Vehicle not found" });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const body = createSchema.parse(req.body);
      const vehicle = await vehicleService.create(body);
      res.status(201).json(vehicle);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: e.errors });
        return;
      }
      res.status(400).json({ error: e instanceof Error ? e.message : "Create failed" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid vehicle id" });
        return;
      }
      const body = updateSchema.parse(req.body);
      const vehicle = await vehicleService.update(id, body);
      res.json(vehicle);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: e.errors });
        return;
      }
      res.status(400).json({ error: e instanceof Error ? e.message : "Update failed" });
    }
  }

  async setOutOfService(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const retired = req.body.retired === true;
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid vehicle id" });
        return;
      }
      const vehicle = await vehicleService.setOutOfService(id, retired);
      res.json(vehicle);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : "Update failed" });
    }
  }
}
