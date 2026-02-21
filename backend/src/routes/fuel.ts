import { Router } from "express";
import { FuelController } from "../controllers/FuelController";
import { authMiddleware } from "../middleware/auth";
import { requireMinRole } from "../middleware/rbac";

const router = Router();
const controller = new FuelController();

router.use(authMiddleware);
router.use(requireMinRole("DISPATCHER"));

router.post("/", (req, res) => controller.create(req, res));
router.get("/vehicle/:vehicleId", (req, res) => controller.listByVehicle(req, res));
router.get("/vehicle/:vehicleId/operational-cost", (req, res) => controller.getOperationalCost(req, res));
router.get("/vehicle/:vehicleId/cost-per-km", (req, res) => controller.getCostPerKm(req, res));

export default router;
