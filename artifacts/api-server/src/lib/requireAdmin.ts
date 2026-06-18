import { Request, Response, NextFunction } from "express";
import { getUserFromSession } from "./auth";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromSession(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
