import type { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { z } from "zod";

const authService = new AuthService();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const body = registerSchema.parse(req.body);
      const result = await authService.register(
        body.email,
        body.password,
        body.name,
        body.role as "FLEET_MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST"
      );
      res.status(201).json(result);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: e.errors });
        return;
      }
      res.status(400).json({ error: e instanceof Error ? e.message : "Registration failed" });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const body = loginSchema.parse(req.body);
      const result = await authService.login(body.email, body.password);
      res.json(result);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: e.errors });
        return;
      }
      res.status(401).json({ error: e instanceof Error ? e.message : "Login failed" });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const body = changePasswordSchema.parse(req.body);
      await authService.changePassword(userId, body.currentPassword, body.newPassword);
      res.json({ ok: true });
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: e.errors });
        return;
      }
      res.status(400).json({ error: e instanceof Error ? e.message : "Change password failed" });
    }
  }
}
