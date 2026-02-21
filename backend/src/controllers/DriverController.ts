import type { Request, Response } from "express";
import { DriverService } from "../services/DriverService";
import { z } from "zod";

const driverService = new DriverService();

const createSchema = z.object({
  name: z.string().min(1),
  licenseNumber: z.string().min(1),
  licenseExpiry: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  licenseCategory: z.string().min(1),
  userId: z.number().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  licenseNumber: z.string().min(1).optional(),
  licenseExpiry: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  licenseCategory: z.string().min(1).optional(),
  status: z.enum(["ON_DUTY", "OFF_DUTY", "SUSPENDED"]).optional(),
  safetyScore: z.number().min(0).max(100).optional(),
  tripCompletionRate: z.number().optional(),
});

export class DriverController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as "ON_DUTY" | "OFF_DUTY" | "SUSPENDED" | undefined;
      const list = await driverService.list({ status });
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed to list drivers" });
    }
  }

  async listAvailable(req: Request, res: Response): Promise<void> {
    try {
      const licenseCategory = req.query.licenseCategory as string | undefined;
      const list = await driverService.listAvailableForAssignment(licenseCategory);
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed to list available drivers" });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid driver id" });
        return;
      }
      const driver = await driverService.getById(id);
      res.json(driver);
    } catch (e) {
      res.status(404).json({ error: e instanceof Error ? e.message : "Driver not found" });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const body = createSchema.parse(req.body);
      const licenseExpiry = new Date(body.licenseExpiry);
      const driver = await driverService.create({
        ...body,
        licenseExpiry,
      });
      res.status(201).json(driver);
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
        res.status(400).json({ error: "Invalid driver id" });
        return;
      }
      const body = updateSchema.parse(req.body);
      const update: Record<string, unknown> = { ...body };
      if (body.licenseExpiry) update.licenseExpiry = new Date(body.licenseExpiry);
      const driver = await driverService.update(id, update as Parameters<typeof driverService.update>[1]);
      res.json(driver);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: e.errors });
        return;
      }
      res.status(400).json({ error: e instanceof Error ? e.message : "Update failed" });
    }
  }
}
