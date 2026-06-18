import { Router } from "express";
import {
  ListAccountsQueryParams,
  CreateAccountBody,
  UpdateAccountBody,
  UpdateAccountParams,
  GetAccountParams,
  DeleteAccountParams,
  ImportAccountsBody,
} from "@workspace/api-zod";
import {
  getAccounts,
  saveAccounts,
  nextId,
  type StoredAccount,
} from "../lib/github-storage";
import { requireAdmin } from "../lib/requireAdmin";

const router = Router();

router.get("/accounts/stats", requireAdmin, async (req, res) => {
  try {
    const accounts = await getAccounts();

    const total = accounts.length;
    const facebook = accounts.filter((a) => a.platform === "facebook").length;
    const instagram = accounts.filter((a) => a.platform === "instagram").length;

    const statusMap: Record<string, number> = {};
    for (const a of accounts) {
      statusMap[a.status] = (statusMap[a.status] ?? 0) + 1;
    }
    const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    res.json({ total, facebook, instagram, byStatus });
  } catch (err) {
    req.log.error({ err }, "Error getting stats");
    res.status(500).json({ error: "Gagal mengambil statistik" });
  }
});

router.get("/accounts", requireAdmin, async (req, res) => {
  try {
    const parsed = ListAccountsQueryParams.safeParse(req.query);
    const filters = parsed.success ? parsed.data : {};

    let accounts = await getAccounts();

    if (filters.platform) {
      accounts = accounts.filter((a) => a.platform === filters.platform);
    }
    if (filters.status) {
      accounts = accounts.filter((a) => a.status === filters.status);
    }

    res.json(accounts);
  } catch (err) {
    req.log.error({ err }, "Error listing accounts");
    res.status(500).json({ error: "Gagal mengambil data akun" });
  }
});

router.post("/accounts/import", requireAdmin, async (req, res) => {
  try {
    const parsed = ImportAccountsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Data tidak valid" });
      return;
    }

    const accounts = await getAccounts();
    let imported = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < parsed.data.accounts.length; i++) {
      const acct = parsed.data.accounts[i]!;
      try {
        const newAccount: StoredAccount = {
          id: nextId(accounts),
          platform: acct.platform,
          nama: acct.nama,
          email: acct.email,
          sandi: acct.sandi,
          tgl_lahir: acct.tgl_lahir ?? null,
          jenis_kelamin: acct.jenis_kelamin ?? null,
          sandi_fb: acct.sandi_fb ?? null,
          kode_2fa: acct.kode_2fa ?? null,
          uid: acct.uid ?? null,
          sandi_email: acct.sandi_email ?? null,
          email_pemulihan: acct.email_pemulihan ?? null,
          status: acct.status ?? "CP",
          catatan: acct.catatan ?? null,
          createdAt: new Date().toISOString(),
        };
        accounts.push(newAccount);
        imported++;
      } catch (e) {
        errors.push({ row: i + 1, error: String(e) });
      }
    }

    await saveAccounts(accounts, `Import ${imported} akun`);

    res.json({
      imported,
      failed: errors.length,
      total: parsed.data.accounts.length,
      errors,
    });
  } catch (err) {
    req.log.error({ err }, "Error importing accounts");
    res.status(500).json({ error: "Gagal import akun" });
  }
});

router.post("/accounts", requireAdmin, async (req, res) => {
  try {
    const parsed = CreateAccountBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Data tidak valid" });
      return;
    }

    const accounts = await getAccounts();
    const data = parsed.data;

    const newAccount: StoredAccount = {
      id: nextId(accounts),
      platform: data.platform,
      nama: data.nama,
      email: data.email,
      sandi: data.sandi,
      tgl_lahir: data.tgl_lahir ?? null,
      jenis_kelamin: data.jenis_kelamin ?? null,
      sandi_fb: data.sandi_fb ?? null,
      kode_2fa: data.kode_2fa ?? null,
      uid: data.uid ?? null,
      sandi_email: data.sandi_email ?? null,
      email_pemulihan: data.email_pemulihan ?? null,
      status: data.status ?? "CP",
      catatan: data.catatan ?? null,
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAccount);
    await saveAccounts(accounts, `Tambah akun: ${newAccount.nama}`);

    res.status(201).json(newAccount);
  } catch (err) {
    req.log.error({ err }, "Error creating account");
    res.status(500).json({ error: "Gagal membuat akun" });
  }
});

router.get("/accounts/:id", requireAdmin, async (req, res) => {
  try {
    const parsed = GetAccountParams.safeParse({ id: Number(req.params["id"]) });
    if (!parsed.success) {
      res.status(400).json({ error: "ID tidak valid" });
      return;
    }

    const accounts = await getAccounts();
    const account = accounts.find((a) => a.id === parsed.data.id);

    if (!account) {
      res.status(404).json({ error: "Akun tidak ditemukan" });
      return;
    }

    res.json(account);
  } catch (err) {
    req.log.error({ err }, "Error getting account");
    res.status(500).json({ error: "Gagal mengambil akun" });
  }
});

router.patch("/accounts/:id", requireAdmin, async (req, res) => {
  try {
    const paramsParsed = UpdateAccountParams.safeParse({ id: Number(req.params["id"]) });
    const bodyParsed = UpdateAccountBody.safeParse(req.body);

    if (!paramsParsed.success || !bodyParsed.success) {
      res.status(400).json({ error: "Data tidak valid" });
      return;
    }

    const accounts = await getAccounts();
    const idx = accounts.findIndex((a) => a.id === paramsParsed.data.id);

    if (idx === -1) {
      res.status(404).json({ error: "Akun tidak ditemukan" });
      return;
    }

    const data = bodyParsed.data;
    const existing = accounts[idx]!;

    const updated: StoredAccount = {
      ...existing,
      ...(data.platform !== undefined && { platform: data.platform }),
      ...(data.nama !== undefined && { nama: data.nama }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.sandi !== undefined && { sandi: data.sandi }),
      ...(data.tgl_lahir !== undefined && { tgl_lahir: data.tgl_lahir }),
      ...(data.jenis_kelamin !== undefined && { jenis_kelamin: data.jenis_kelamin }),
      ...(data.sandi_fb !== undefined && { sandi_fb: data.sandi_fb }),
      ...(data.kode_2fa !== undefined && { kode_2fa: data.kode_2fa }),
      ...(data.uid !== undefined && { uid: data.uid }),
      ...(data.sandi_email !== undefined && { sandi_email: data.sandi_email }),
      ...(data.email_pemulihan !== undefined && { email_pemulihan: data.email_pemulihan }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.catatan !== undefined && { catatan: data.catatan }),
    };

    accounts[idx] = updated;
    await saveAccounts(accounts, `Update akun: ${updated.nama}`);

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error updating account");
    res.status(500).json({ error: "Gagal update akun" });
  }
});

router.delete("/accounts/:id", requireAdmin, async (req, res) => {
  try {
    const parsed = DeleteAccountParams.safeParse({ id: Number(req.params["id"]) });
    if (!parsed.success) {
      res.status(400).json({ error: "ID tidak valid" });
      return;
    }

    const accounts = await getAccounts();
    const idx = accounts.findIndex((a) => a.id === parsed.data.id);

    if (idx === -1) {
      res.status(404).json({ error: "Akun tidak ditemukan" });
      return;
    }

    const removed = accounts[idx]!;
    accounts.splice(idx, 1);
    await saveAccounts(accounts, `Hapus akun: ${removed.nama}`);

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting account");
    res.status(500).json({ error: "Gagal hapus akun" });
  }
});

export default router;
