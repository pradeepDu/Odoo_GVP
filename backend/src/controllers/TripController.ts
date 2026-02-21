import type { Request, Response } from "express";
import { TripService } from "../services/TripService";
import { z } from "zod";

const tripService = new TripService();

const createSchema = z.object({
  vehicleId: z.number().int().positive(),
  driverId: z.number().int().positive(),
  cargoWeightKg: z.number().positive(),
  origin: z.string().optional(),
  destination: z.string().optional(),
});

export class TripController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { status, vehicleId, driverId } = req.query;
      const filters = {
        status: status as "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED" | undefined,
        vehicleId: vehicleId ? Number(vehicleId) : undefined,
        driverId: driverId ? Number(driverId) : undefined,
      };
      const list = await tripService.list(filters);
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed to list trips" });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid trip id" });
        return;
      }
      const trip = await tripService.getById(id);
      res.json(trip);
    } catch (e) {
      res.status(404).json({ error: e instanceof Error ? e.message : "Trip not found" });
    }
  }

  async validateCreate(req: Request, res: Response): Promise<void> {
    try {
      const body = createSchema.parse(req.body);
      const result = await tripService.validateCreate(body);
      res.json(result);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: e.errors });
        return;
      }
      res.status(400).json({ error: e instanceof Error ? e.message : "Validation failed" });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const body = createSchema.parse(req.body);
      const trip = await tripService.create(body);
      res.status(201).json(trip);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: e.errors });
        return;
      }
      res.status(400).json({ error: e instanceof Error ? e.message : "Create failed" });
    }
  }

  async dispatch(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid trip id" });
        return;
      }
      const trip = await tripService.dispatch(id);
      res.json(trip);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : "Dispatch failed" });
    }
  }

  async complete(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { endOdometer } = req.body;
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid trip id" });
        return;
      }
      if (typeof endOdometer !== "number" || endOdometer < 0) {
        res.status(400).json({ error: "endOdometer required and must be a positive number" });
        return;
      }
      const trip = await tripService.complete(id, endOdometer);
      res.json(trip);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : "Complete failed" });
    }
  }

  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid trip id" });
        return;
      }
      const trip = await tripService.cancel(id);
      res.json(trip);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : "Cancel failed" });
    }
  }
}
