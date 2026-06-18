import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accountsTable = pgTable("accounts", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  nama: text("nama").notNull(),
  tgl_lahir: text("tgl_lahir"),
  jenis_kelamin: text("jenis_kelamin"),
  email: text("email").notNull(),
  sandi: text("sandi").notNull(),
  sandi_fb: text("sandi_fb"),
  kode_2fa: text("kode_2fa"),
  uid: text("uid"),
  sandi_email: text("sandi_email"),
  email_pemulihan: text("email_pemulihan"),
  status: text("status").notNull().default("CP"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAccountSchema = createInsertSchema(accountsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accountsTable.$inferSelect;
