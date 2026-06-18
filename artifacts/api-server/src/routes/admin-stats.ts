import { Router } from "express";
import { eq, count, sum } from "drizzle-orm";
import { db } from "@workspace/db";
import { productsTable, ordersTable } from "@workspace/db";
import { requireAdmin } from "../lib/requireAdmin";

const router = Router();

router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [
      [productStats],
      [activeStats],
      [orderStats],
      [pendingStats],
      [deliveredStats],
      [revenueStats],
    ] = await Promise.all([
      db.select({ total: count() }).from(productsTable),
      db.select({ total: count() }).from(productsTable).where(eq(productsTable.isActive, true)),
      db.select({ total: count() }).from(ordersTable),
      db.select({ total: count() }).from(ordersTable).where(eq(ordersTable.status, "paid")),
      db.select({ total: count() }).from(ordersTable).where(eq(ordersTable.status, "delivered")),
      db.select({ total: sum(ordersTable.totalPrice) }).from(ordersTable).where(eq(ordersTable.status, "delivered")),
    ]);

    res.json({
      totalProducts: productStats?.total ?? 0,
      activeProducts: activeStats?.total ?? 0,
      totalOrders: orderStats?.total ?? 0,
      pendingOrders: pendingStats?.total ?? 0,
      deliveredOrders: deliveredStats?.total ?? 0,
      totalRevenue: Number(revenueStats?.total ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting admin stats");
    res.status(500).json({ error: "Gagal mengambil statistik" });
  }
});

export default router;
