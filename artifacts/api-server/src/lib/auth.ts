import type { Request } from "express";

export const SESSION_SECRET = process.env["SESSION_SECRET"] ?? "dev-secret-please-change";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "an3dis13";

export function checkCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function setSessionUser(req: Request, username: string) {
  const session = (req as unknown as { session: Record<string, unknown> }).session;
  session["user"] = { id: "admin", username };
}

export function getUserFromSession(req: Request) {
  const session = (req as unknown as { session: Record<string, unknown> }).session;
  if (!session || !session["user"]) return null;
  return session["user"] as { id: string; username: string };
}
