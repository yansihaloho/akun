import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { ordersTable, productsTable } from "@workspace/db";
import { requireAdmin } from "../lib/requireAdmin";
import { z } from "zod";

const router = Router();

const MAX_PROOF_BYTES = 5 * 1024 * 1024;

function generateOrderCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const CreateOrderSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
  buyerName: z.string().min(1).max(200),
  buyerWhatsapp: z.string().min(5).max(30),
});

const UpdateOrderSchema = z.object({
  status: z.enum(["pending", "paid", "delivered", "cancelled"]).optional(),
  credentials: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.post("/orders", async (req, res) => {
  try {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Data tidak valid", details: parsed.error.issues });
      return;
    }
    const { productId, quantity, buyerName, buyerWhatsapp } = parsed.data;

    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId));
    if (!product || !product.isActive) {
      res.status(404).json({ error: "Produk tidak ditemukan" });
      return;
    }
    if (product.stock < quantity) {
      res.status(400).json({ error: "Stok tidak mencukupi" });
      return;
    }

    let orderCode = generateOrderCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db
        .select({ id: ordersTable.id })
        .from(ordersTable)
        .where(eq(ordersTable.orderCode, orderCode));
      if (existing.length === 0) break;
      orderCode = generateOrderCode();
      attempts++;
    }
    if (attempts >= 10) {
      res.status(500).json({ error: "Gagal membuat kode pesanan unik, coba lagi" });
      return;
    }

    const totalPrice = product.price * quantity;

    await db
      .update(productsTable)
      .set({ stock: Math.max(0, product.stock - quantity) })
      .where(eq(productsTable.id, productId));

    const [order] = await db
      .insert(ordersTable)
      .values({
        orderCode,
        productId,
        productName: product.name,
        quantity,
        totalPrice,
        buyerName,
        buyerWhatsapp,
        status: "pending",
      })
      .returning();

    res.status(201).json(order);
  } catch (err) {
    req.log.error({ err }, "Error creating order");
    res.status(500).json({ error: "Gagal membuat pesanan" });
  }
});

router.get("/orders/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.orderCode, code));
    if (!order) {
      res.status(404).json({ error: "Pesanan tidak ditemukan" });
      return;
    }
    const safeOrder = {
      ...order,
      paymentProof: order.paymentProof ? "[uploaded]" : null,
      credentials: order.status === "delivered" ? order.credentials : null,
    };
    res.json(safeOrder);
  } catch (err) {
    req.log.error({ err }, "Error getting order");
    res.status(500).json({ error: "Gagal mengambil pesanan" });
  }
});

router.post("/orders/:code/proof", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const { proof } = req.body as { proof?: string };
    if (!proof) {
      res.status(400).json({ error: "Bukti pembayaran diperlukan" });
      return;
    }

    const proofBytes = Buffer.byteLength(proof, "utf8");
    if (proofBytes > MAX_PROOF_BYTES) {
      res.status(413).json({ error: `Ukuran bukti terlalu besar (maks 5MB). Kompres gambar terlebih dahulu.` });
      return;
    }

    const [existing] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.orderCode, code));
    if (!existing) {
      res.status(404).json({ error: "Pesanan tidak ditemukan" });
      return;
    }
    if (existing.status !== "pending") {
      res.status(400).json({ error: "Pesanan tidak dalam status pending" });
      return;
    }
    const [order] = await db
      .update(ordersTable)
      .set({ paymentProof: proof, status: "paid" })
      .where(eq(ordersTable.orderCode, code))
      .returning();
    res.json({ ok: true, status: order.status });
  } catch (err) {
    req.log.error({ err }, "Error uploading proof");
    res.status(500).json({ error: "Gagal mengupload bukti bayar" });
  }
});

router.get("/admin/orders", requireAdmin, async (req, res) => {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));
    res.json(orders);
  } catch (err) {
    req.log.error({ err }, "Error listing orders");
    res.status(500).json({ error: "Gagal mengambil pesanan" });
  }
});

router.get("/admin/orders/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) { res.status(404).json({ error: "Pesanan tidak ditemukan" }); return; }
    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Error getting order");
    res.status(500).json({ error: "Gagal mengambil pesanan" });
  }
});

router.patch("/admin/orders/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }
    const parsed = UpdateOrderSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Data tidak valid" }); return; }

    const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!existing) { res.status(404).json({ error: "Pesanan tidak ditemukan" }); return; }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.credentials !== undefined) updateData.credentials = parsed.data.credentials;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

    const newStatus = parsed.data.status;

    if (newStatus && newStatus !== existing.status) {
      const [product] = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, existing.productId));

      if (product) {
        if (newStatus === "delivered" && existing.status !== "delivered") {
          await db
            .update(productsTable)
            .set({ totalSold: product.totalSold + existing.quantity })
            .where(eq(productsTable.id, product.id));
        } else if (newStatus === "cancelled" && existing.status !== "cancelled") {
          await db
            .update(productsTable)
            .set({ stock: product.stock + existing.quantity })
            .where(eq(productsTable.id, product.id));
        }
      }
    }

    const [order] = await db
      .update(ordersTable)
      .set(updateData)
      .where(eq(ordersTable.id, id))
      .returning();
    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Error updating order");
    res.status(500).json({ error: "Gagal mengupdate pesanan" });
  }
});

export default router;
