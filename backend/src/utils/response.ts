import type { Response } from "express";
import { z } from "zod";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data: T | null;
  message: string;
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "",
  status = 200
): void {
  res.status(status).json({
    success: true,
    data,
    message,
  });
}

export function sendError(
  res: Response,
  message: string,
  status = 400
): void {
  res.status(status).json({
    success: false,
    data: null,
    message,
  });
}

export function zodErrorToMessage(e: z.ZodError): string {
  const first = e.errors[0];
  if (!first) return "Validation failed";
  const path = first.path.length ? `${first.path.join(".")}: ` : "";
  return path + (first.message || "Invalid value");
}
