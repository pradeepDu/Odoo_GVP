import type { Request, Response } from "express";
import { StatsService } from "../services/StatsService";
import { sendSuccess, sendError } from "../utils/response";

const statsService = new StatsService();

export class DashboardController {
  async getKPIs(req: Request, res: Response): Promise<void> {
    try {
      const kpis = await statsService.getDashboardKPIs();
      sendSuccess(res, kpis);
    } catch (e) {
      sendError(res, e instanceof Error ? e.message : "Failed to load KPIs", 500);
    }
  }
}
