import type { Request, Response } from "express";
import { AnalyticsService } from "../services/AnalyticsService";
import { sendSuccess, sendError } from "../utils/response";

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getFuelEfficiency(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        sendError(res, "Invalid vehicle id", 400);
        return;
      }
      const result = await analyticsService.getFuelEfficiencyByVehicle(vehicleId);
      sendSuccess(res, result ?? { kmPerL: 0, totalKm: 0, totalLiters: 0 });
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to load fuel efficiency", 500);
    }
  }

  async getVehicleROI(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        sendError(res, "Invalid vehicle id", 400);
        return;
      }
      const result = await analyticsService.getVehicleROISummary(vehicleId);
      sendSuccess(res, result);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to load ROI", 500);
    }
  }

  async getMonthlyFuelSummary(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;
      const result = await analyticsService.getMonthlyFuelSummary(vehicleId);
      sendSuccess(res, result);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to load monthly fuel summary", 500);
    }
  }

  async getDriverSafetySummary(req: Request, res: Response): Promise<void> {
    try {
      const result = await analyticsService.getDriverSafetySummary();
      sendSuccess(res, result);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to load driver safety summary", 500);
    }
  }
}
