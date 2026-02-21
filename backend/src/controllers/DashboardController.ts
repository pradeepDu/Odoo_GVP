import type { Request, Response } from "express";
import { StatsService } from "../services/StatsService";

const statsService = new StatsService();

export class DashboardController {
  async getKPIs(req: Request, res: Response): Promise<void> {
    try {
      const kpis = await statsService.getDashboardKPIs();
      res.json(kpis);
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load KPIs" });
    }
  }
}
