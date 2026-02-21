import { Router } from "express";
import { TripController } from "../controllers/TripController";
import { authMiddleware } from "../middleware/auth";
import { requireMinRole } from "../middleware/rbac";

const router = Router();
const controller = new TripController();

router.use(authMiddleware);
router.use(requireMinRole("DISPATCHER"));

router.get("/", (req, res) => controller.list(req, res));
router.post("/validate", (req, res) => controller.validateCreate(req, res));
router.post("/", (req, res) => controller.create(req, res));
router.get("/:id", (req, res) => controller.getById(req, res));
router.post("/:id/dispatch", (req, res) => controller.dispatch(req, res));
router.post("/:id/complete", (req, res) => controller.complete(req, res));
router.post("/:id/cancel", (req, res) => controller.cancel(req, res));

export default router;
