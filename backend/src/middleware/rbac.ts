import type { Request, Response, NextFunction } from "express";

type RoleName = "FLEET_MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";

const ROLE_HIERARCHY: Record<RoleName, number> = {
  FLEET_MANAGER: 4,
  DISPATCHER: 3,
  SAFETY_OFFICER: 2,
  FINANCIAL_ANALYST: 1,
};

export function requireRole(...allowed: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.role) {
      res.status(403).json({ error: "Forbidden: role required" });
      return;
    }
    if (!allowed.includes(req.role as RoleName)) {
      res.status(403).json({ error: "Forbidden: insufficient role" });
      return;
    }
    next();
  };
}

export function requireMinRole(minRole: RoleName) {
  const minLevel = ROLE_HIERARCHY[minRole];
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.role) {
      res.status(403).json({ error: "Forbidden: role required" });
      return;
    }
    const level = ROLE_HIERARCHY[req.role as RoleName];
    if (level === undefined || level < minLevel) {
      res.status(403).json({ error: "Forbidden: insufficient role" });
      return;
    }
    next();
  };
}
