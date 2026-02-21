import type { Request, Response } from "express";
import { AnalyticsService } from "../services/AnalyticsService";

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getFuelEfficiency(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        res.status(400).json({ error: "Invalid vehicle id" });
        return;
      }
      const result = await analyticsService.getFuelEfficiencyByVehicle(vehicleId);
      res.json(result ?? { kmPerL: 0, totalKm: 0, totalLiters: 0 });
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed" });
    }
  }

  async getVehicleROI(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Number(req.params.vehicleId);
      if (Number.isNaN(vehicleId)) {
        res.status(400).json({ error: "Invalid vehicle id" });
        return;
      }
      const result = await analyticsService.getVehicleROISummary(vehicleId);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed" });
    }
  }

  async getMonthlyFuelSummary(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;
      const result = await analyticsService.getMonthlyFuelSummary(vehicleId);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed" });
    }
  }

  async getDriverSafetySummary(req: Request, res: Response): Promise<void> {
    try {
      const result = await analyticsService.getDriverSafetySummary();
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed" });
    }
  }
}
