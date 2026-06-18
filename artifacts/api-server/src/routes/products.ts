import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { requireAdmin } from "../lib/requireAdmin";
import { z } from "zod";

const router = Router();

const ProductInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  imageUrl: z.string().optional().nullable(),
  price: z.number().int().positive(),
  stock: z.number().int().min(0).default(0),
  warrantyDays: z.number().int().min(0).default(1),
  platform: z.string().default("facebook"),
  category: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const ProductUpdateSchema = ProductInputSchema.partial();

router.get("/products", async (req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.isActive, true))
      .orderBy(productsTable.id);
    res.json(products);
  } catch (err) {
    req.log.error({ err }, "Error listing products");
    res.status(500).json({ error: "Gagal mengambil produk" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product || !product.isActive) { res.status(404).json({ error: "Produk tidak ditemukan" }); return; }
    res.json(product);
  } catch (err) {
    req.log.error({ err }, "Error getting product");
    res.status(500).json({ error: "Gagal mengambil produk" });
  }
});

router.get("/admin/products", requireAdmin, async (req, res) => {
  try {
    const products = await db.select().from(productsTable).orderBy(productsTable.id);
    res.json(products);
  } catch (err) {
    req.log.error({ err }, "Error listing admin products");
    res.status(500).json({ error: "Gagal mengambil produk" });
  }
});

router.post("/admin/products", requireAdmin, async (req, res) => {
  try {
    const parsed = ProductInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Data tidak valid" }); return; }
    const [product] = await db.insert(productsTable).values(parsed.data).returning();
    res.status(201).json(product);
  } catch (err) {
    req.log.error({ err }, "Error creating product");
    res.status(500).json({ error: "Gagal membuat produk" });
  }
});

router.patch("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }
    const parsed = ProductUpdateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Data tidak valid" }); return; }
    const [product] = await db
      .update(productsTable)
      .set(parsed.data)
      .where(eq(productsTable.id, id))
      .returning();
    if (!product) { res.status(404).json({ error: "Produk tidak ditemukan" }); return; }
    res.json(product);
  } catch (err) {
    req.log.error({ err }, "Error updating product");
    res.status(500).json({ error: "Gagal mengupdate produk" });
  }
});

router.delete("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }
    const [product] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, id))
      .returning();
    if (!product) { res.status(404).json({ error: "Produk tidak ditemukan" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting product");
    res.status(500).json({ error: "Gagal menghapus produk" });
  }
});

export default router;
