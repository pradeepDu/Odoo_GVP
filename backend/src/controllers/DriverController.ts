import type { Request, Response } from "express";
import { z } from "zod";
import { DriverService } from "../services/DriverService";
import { sendSuccess, sendError, zodErrorToMessage } from "../utils/response";

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
      sendSuccess(res, list);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to list drivers", 500);
    }
  }

  async listAvailable(req: Request, res: Response): Promise<void> {
    try {
      const licenseCategory = req.query.licenseCategory as string | undefined;
      const list = await driverService.listAvailableForAssignment(licenseCategory);
      sendSuccess(res, list);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to list available drivers", 500);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        sendError(res, "Invalid driver id", 400);
        return;
      }
      const driver = await driverService.getById(id);
      sendSuccess(res, driver);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Driver not found", 404);
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
      sendSuccess(res, driver, "Driver added", 201);
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
        sendError(res, "Invalid driver id", 400);
        return;
      }
      const body = updateSchema.parse(req.body);
      const update: Record<string, unknown> = { ...body };
      if (body.licenseExpiry) update.licenseExpiry = new Date(body.licenseExpiry);
      const driver = await driverService.update(id, update as Parameters<typeof driverService.update>[1]);
      sendSuccess(res, driver, "Driver updated");
    } catch (e) {
      if (e instanceof z.ZodError) {
        sendError(res, zodErrorToMessage(e), 400);
        return;
      }
      sendError(res, e instanceof Error ? e.message : "Update failed", 400);
    }
  }
}
