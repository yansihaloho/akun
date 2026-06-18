import type { Request, Response, NextFunction } from "express";
import { getUserFromSession } from "../lib/auth";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromSession(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as unknown as Record<string, unknown>)["user"] = user;
  next();
}
