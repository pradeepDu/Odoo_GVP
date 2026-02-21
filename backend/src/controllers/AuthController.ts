import type { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "../services/AuthService";
import { sendSuccess, sendError, zodErrorToMessage } from "../utils/response";

const authService = new AuthService();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z
    .enum([
      "FLEET_MANAGER",
      "DISPATCHER",
      "SAFETY_OFFICER",
      "FINANCIAL_ANALYST",
    ])
    .optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const verifyTokenSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
});

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const body = registerSchema.parse(req.body);
      const result = await authService.register(
        body.email,
        body.password,
        body.name,
        body.role as
          | "FLEET_MANAGER"
          | "DISPATCHER"
          | "SAFETY_OFFICER"
          | "FINANCIAL_ANALYST",
      );
      sendSuccess(res, result, "Account created", 201);
    } catch (e) {
      if (e instanceof z.ZodError) {
        sendError(res, zodErrorToMessage(e), 400);
        return;
      }
      sendError(res, e instanceof Error ? e.message : "Registration failed", 400);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const body = loginSchema.parse(req.body);
      const result = await authService.login(body.email, body.password);
      sendSuccess(res, result, "Signed in successfully");
    } catch (e) {
      if (e instanceof z.ZodError) {
        sendError(res, zodErrorToMessage(e), 400);
        return;
      }
      sendError(res, e instanceof Error ? e.message : "Login failed", 401);
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        sendError(res, "Unauthorized", 401);
        return;
      }
      const body = changePasswordSchema.parse(req.body);
      await authService.changePassword(
        userId,
        body.currentPassword,
        body.newPassword,
      );
      sendSuccess(res, { ok: true }, "Password updated");
    } catch (e) {
      if (e instanceof z.ZodError) {
        sendError(res, zodErrorToMessage(e), 400);
        return;
      }
      sendError(res, e instanceof Error ? e.message : "Change password failed", 400);
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const body = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(body.email);
      sendSuccess(res, result, result.message || "Check your email for reset link");
    } catch (e) {
      if (e instanceof z.ZodError) {
        sendError(res, zodErrorToMessage(e), 400);
        return;
      }
      console.error("Forgot password error:", e);
      sendError(res, e instanceof Error ? e.message : "Failed to process request", 500);
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const body = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(
        body.token,
        body.newPassword,
      );
      sendSuccess(res, result, result.message || "Password reset successfully");
    } catch (e) {
      if (e instanceof z.ZodError) {
        sendError(res, zodErrorToMessage(e), 400);
        return;
      }
      sendError(res, e instanceof Error ? e.message : "Password reset failed", 400);
    }
  }

  async verifyResetToken(req: Request, res: Response): Promise<void> {
    try {
      const body = verifyTokenSchema.parse(req.body);
      const result = await authService.verifyResetToken(body.token);
      sendSuccess(res, result, result.valid ? "" : result.message);
    } catch (e) {
      if (e instanceof z.ZodError) {
        sendError(res, zodErrorToMessage(e), 400);
        return;
      }
      sendError(res, "Token verification failed", 400);
    }
  }
}
