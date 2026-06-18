const GITHUB_TOKEN = process.env["GITHUB_PERSONAL_ACCESS_TOKEN"];
const GITHUB_REPO = "yansihaloho/akun";
const FILE_PATH = "data/accounts.json";
const API_BASE = "https://api.github.com";

export interface StoredAccount {
  id: number;
  platform: string;
  nama: string;
  tgl_lahir: string | null;
  jenis_kelamin: string | null;
  email: string;
  sandi: string;
  sandi_fb: string | null;
  kode_2fa: string | null;
  uid: string | null;
  sandi_email: string | null;
  email_pemulihan: string | null;
  status: string;
  catatan: string | null;
  createdAt: string;
  productId: number | null;
  soldOrderCode: string | null;
}

function headers() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// Simple async mutex to serialize all GitHub read-modify-write operations.
// This prevents race conditions where two concurrent requests both read,
// modify, and write — causing one to overwrite the other's changes.
type ResolveFn = () => void;
let _locked = false;
const _queue: ResolveFn[] = [];

function acquireLock(): Promise<void> {
  if (!_locked) {
    _locked = true;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => _queue.push(resolve));
}

function releaseLock(): void {
  const next = _queue.shift();
  if (next) {
    next();
  } else {
    _locked = false;
  }
}

// Always fetch a fresh SHA from GitHub before writing to avoid 409 conflicts.
async function fetchSha(): Promise<string> {
  const res = await fetch(
    `${API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: headers() }
  );
  if (res.status === 404) return "";
  if (!res.ok) throw new Error(`GitHub SHA fetch error: ${res.status}`);
  const data = (await res.json()) as { sha: string };
  return data.sha;
}

export async function getAccounts(): Promise<StoredAccount[]> {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN not set");

  const res = await fetch(
    `${API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: headers() }
  );

  if (res.status === 404) return [];

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { content: string; sha: string };
  const raw = Buffer.from(data.content, "base64").toString("utf-8");
  return JSON.parse(raw) as StoredAccount[];
}

export async function saveAccounts(accounts: StoredAccount[], message: string): Promise<void> {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN not set");

  await acquireLock();
  try {
    // Always read the current SHA right before writing to avoid 409 conflicts.
    const currentSha = await fetchSha();
    const content = Buffer.from(JSON.stringify(accounts, null, 2)).toString("base64");

    const body: Record<string, unknown> = { message, content };
    if (currentSha) body["sha"] = currentSha;

    const res = await fetch(
      `${API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
      {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`GitHub API write error: ${res.status} ${txt}`);
    }
  } finally {
    releaseLock();
  }
}

export function nextId(accounts: StoredAccount[]): number {
  if (accounts.length === 0) return 1;
  return Math.max(...accounts.map((a) => a.id)) + 1;
}

export function formatAccountCredentials(account: StoredAccount): string {
  const lines: string[] = [];
  lines.push(`Nama    : ${account.nama}`);
  if (account.uid) lines.push(`UID FB  : ${account.uid}`);
  lines.push(`Email   : ${account.email}`);
  lines.push(`Sandi FB: ${account.sandi}`);
  if (account.sandi_email) lines.push(`Sandi Email: ${account.sandi_email}`);
  if (account.kode_2fa) lines.push(`2FA     : ${account.kode_2fa}`);
  if (account.email_pemulihan) lines.push(`Email Pemulihan: ${account.email_pemulihan}`);
  if (account.sandi_fb) lines.push(`Sandi FB Alt: ${account.sandi_fb}`);
  return lines.join("\n");
}
