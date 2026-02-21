import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { authMiddleware } from "../middleware/auth";
import { requireMinRole } from "../middleware/rbac";

const router = Router();
const controller = new DashboardController();

router.get("/kpis", authMiddleware, requireMinRole("DISPATCHER"), (req, res) => controller.getKPIs(req, res));

export default router;
