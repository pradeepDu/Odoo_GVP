import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const controller = new AuthController();

router.post("/register", (req, res) => controller.register(req, res));
router.post("/login", (req, res) => controller.login(req, res));
router.post("/forgot-password", (req, res) =>
  controller.forgotPassword(req, res),
);
router.post("/reset-password", (req, res) =>
  controller.resetPassword(req, res),
);
router.post("/verify-reset-token", (req, res) =>
  controller.verifyResetToken(req, res),
);
router.post("/change-password", authMiddleware, (req, res) =>
  controller.changePassword(req, res),
);

export default router;
