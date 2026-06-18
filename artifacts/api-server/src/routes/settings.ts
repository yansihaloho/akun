import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { requireAdmin } from "../lib/requireAdmin";
import { z } from "zod";

const router = Router();

const QrisSchema = z.object({
  image: z.string().min(10),
  accountName: z.string().optional().default(""),
  accountNumber: z.string().optional().default(""),
});

router.get("/settings/qris", async (req, res) => {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "qris"));
    if (!row) { res.json({ image: null, accountName: "", accountNumber: "" }); return; }
    try {
      res.json(JSON.parse(row.value));
    } catch {
      res.json({ image: row.value, accountName: "", accountNumber: "" });
    }
  } catch (err) {
    req.log.error({ err }, "Error getting QRIS");
    res.status(500).json({ error: "Gagal mengambil QRIS" });
  }
});

router.post("/admin/settings/qris", requireAdmin, async (req, res) => {
  try {
    const parsed = QrisSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Data tidak valid" }); return; }
    const value = JSON.stringify(parsed.data);
    await db
      .insert(settingsTable)
      .values({ key: "qris", value })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value } });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Error saving QRIS");
    res.status(500).json({ error: "Gagal menyimpan QRIS" });
  }
});

export default router;
