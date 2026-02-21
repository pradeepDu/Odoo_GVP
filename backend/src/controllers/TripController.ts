import type { Request, Response } from "express";
import { z } from "zod";
import { TripService } from "../services/TripService";
import { sendSuccess, sendError, zodErrorToMessage } from "../utils/response";

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
      sendSuccess(res, list);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to list trips", 500);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        sendError(res, "Invalid trip id", 400);
        return;
      }
      const trip = await tripService.getById(id);
      sendSuccess(res, trip);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Trip not found", 404);
    }
  }

  async validateCreate(req: Request, res: Response): Promise<void> {
    try {
      const body = createSchema.parse(req.body);
      const result = await tripService.validateCreate(body);
      sendSuccess(res, result);
    } catch (e) {
      if (e instanceof z.ZodError) {
        sendError(res, zodErrorToMessage(e), 400);
        return;
      }
      sendError(res, e instanceof Error ? e.message : "Validation failed", 400);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const body = createSchema.parse(req.body);
      const trip = await tripService.create(body);
      sendSuccess(res, trip, "Trip created", 201);
    } catch (e) {
      if (e instanceof z.ZodError) {
        sendError(res, zodErrorToMessage(e), 400);
        return;
      }
      sendError(res, e instanceof Error ? e.message : "Create failed", 400);
    }
  }

  async dispatch(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        sendError(res, "Invalid trip id", 400);
        return;
      }
      const trip = await tripService.dispatch(id);
      sendSuccess(res, trip, "Trip dispatched");
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Dispatch failed", 400);
    }
  }

  async complete(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { endOdometer } = req.body;
      if (Number.isNaN(id)) {
        sendError(res, "Invalid trip id", 400);
        return;
      }
      if (typeof endOdometer !== "number" || endOdometer < 0) {
        sendError(res, "endOdometer required and must be a positive number", 400);
        return;
      }
      const trip = await tripService.complete(id, endOdometer);
      sendSuccess(res, trip, "Trip completed");
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Complete failed", 400);
    }
  }

  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        sendError(res, "Invalid trip id", 400);
        return;
      }
      const trip = await tripService.cancel(id);
      sendSuccess(res, trip, "Trip cancelled");
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Cancel failed", 400);
    }
  }
}
