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
}

function headers() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

let _sha = "";

export async function getAccounts(): Promise<StoredAccount[]> {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN not set");

  const res = await fetch(
    `${API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: headers() }
  );

  if (res.status === 404) {
    _sha = "";
    return [];
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { content: string; sha: string };
  _sha = data.sha;
  const raw = Buffer.from(data.content, "base64").toString("utf-8");
  return JSON.parse(raw) as StoredAccount[];
}

export async function saveAccounts(accounts: StoredAccount[], message: string): Promise<void> {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN not set");

  const content = Buffer.from(JSON.stringify(accounts, null, 2)).toString("base64");

  const body: Record<string, unknown> = {
    message,
    content,
  };

  if (_sha) {
    body["sha"] = _sha;
  }

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

  const result = (await res.json()) as { content?: { sha?: string } };
  if (result.content?.sha) {
    _sha = result.content.sha;
  }
}

export function nextId(accounts: StoredAccount[]): number {
  if (accounts.length === 0) return 1;
  return Math.max(...accounts.map((a) => a.id)) + 1;
}
