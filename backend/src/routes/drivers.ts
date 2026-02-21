import { Router } from "express";
import { DriverController } from "../controllers/DriverController";
import { authMiddleware } from "../middleware/auth";
import { requireMinRole } from "../middleware/rbac";

const router = Router();
const controller = new DriverController();

router.use(authMiddleware);
router.use(requireMinRole("DISPATCHER"));

router.get("/", (req, res) => controller.list(req, res));
router.get("/available", (req, res) => controller.listAvailable(req, res));
router.get("/:id", (req, res) => controller.getById(req, res));
router.post("/", (req, res) => controller.create(req, res));
router.patch("/:id", (req, res) => controller.update(req, res));

export default router;
