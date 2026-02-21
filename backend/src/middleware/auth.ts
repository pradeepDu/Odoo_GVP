import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma";
import { sendError } from "../utils/response";

const JWT_SECRET = process.env.JWT_SECRET || "fleetflow-secret-change-in-production";

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    sendError(res, "Missing or invalid authorization header", 401);
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });
    if (!user) {
      sendError(res, "User not found", 401);
      return;
    }
    req.userId = user.id;
    req.role = user.role?.name ?? undefined;
    next();
  } catch {
    sendError(res, "Invalid or expired token", 401);
  }
}

export function signToken(payload: JwtPayload, expiresIn = "7d"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
