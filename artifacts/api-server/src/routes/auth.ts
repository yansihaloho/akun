import { Router } from "express";
import { checkCredentials, setSessionUser, getUserFromSession } from "../lib/auth";

const router = Router();

router.get("/auth/user", (req, res) => {
  const user = getUserFromSession(req);
  res.json({ user: user ? { id: user.id, username: user.username } : null });
});

router.post("/auth/login", (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username dan password diperlukan" });
    return;
  }

  if (!checkCredentials(username, password)) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  setSessionUser(req, username);
  res.json({ ok: true });
});

router.post("/auth/logout", (req, res) => {
  const session = (req as unknown as { session: { destroy: (cb: (err: unknown) => void) => void } }).session;
  session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
