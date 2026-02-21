import { Router } from "express";
import { AnalyticsController } from "../controllers/AnalyticsController";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
const controller = new AnalyticsController();

router.use(authMiddleware);
router.use(requireRole("FLEET_MANAGER", "FINANCIAL_ANALYST"));

router.get("/fuel-efficiency/vehicle/:vehicleId", (req, res) => controller.getFuelEfficiency(req, res));
router.get("/vehicle-roi/:vehicleId", (req, res) => controller.getVehicleROI(req, res));
router.get("/monthly-fuel", (req, res) => controller.getMonthlyFuelSummary(req, res));
router.get("/driver-safety", (req, res) => controller.getDriverSafetySummary(req, res));

export default router;
