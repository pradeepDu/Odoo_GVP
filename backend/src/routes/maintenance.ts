import { Router } from "express";
import { MaintenanceController } from "../controllers/MaintenanceController";
import { authMiddleware } from "../middleware/auth";
import { requireMinRole } from "../middleware/rbac";

const router = Router();
const controller = new MaintenanceController();

router.use(authMiddleware);
router.use(requireMinRole("FLEET_MANAGER"));

router.get("/", (req, res) => controller.list(req, res));
router.get("/vehicle/:vehicleId", (req, res) => controller.listByVehicle(req, res));
router.post("/", (req, res) => controller.create(req, res));
router.post("/vehicle/:vehicleId/release", (req, res) => controller.releaseVehicle(req, res));

export default router;
