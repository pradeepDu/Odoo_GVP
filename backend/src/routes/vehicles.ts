import { Router } from "express";
import { VehicleController } from "../controllers/VehicleController";
import { authMiddleware } from "../middleware/auth";
import { requireMinRole } from "../middleware/rbac";

const router = Router();
const controller = new VehicleController();

router.use(authMiddleware);
router.use(requireMinRole("DISPATCHER"));

router.get("/", (req, res) => controller.list(req, res));
router.get("/available", (req, res) => controller.listAvailable(req, res));
router.get("/:id", (req, res) => controller.getById(req, res));
router.post("/", (req, res) => controller.create(req, res));
router.patch("/:id", (req, res) => controller.update(req, res));
router.post("/:id/out-of-service", (req, res) => controller.setOutOfService(req, res));

export default router;
