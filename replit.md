# SocMedia Ops

Platform manajemen akun media sosial (Facebook/Instagram) dengan toko publik untuk jual-beli akun, pembayaran QRIS, dan panel admin lengkap.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — session secret (min 32 chars)
- Required env: `GITHUB_PERSONAL_ACCESS_TOKEN` — token untuk GitHub account storage

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (products, orders, settings, sessions)
- Account storage: GitHub Contents API (repo: yansihaloho/akun, file: data/accounts.json)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + TailwindCSS + shadcn/ui

## Where things live

- `artifacts/api-server/src/routes/` — semua API route (auth, accounts, products, orders, settings, admin-stats)
- `artifacts/api-server/src/lib/` — auth, requireAdmin middleware, github-storage, logger
- `artifacts/socmedia/src/pages/` — frontend pages (admin + shop)
- `artifacts/socmedia/src/pages/admin/` — admin panel pages
- `artifacts/socmedia/src/pages/shop/` — public shop pages
- `lib/db/src/schema/` — Drizzle ORM schema (products, orders, settings, sessions)
- `lib/api-spec/` — OpenAPI spec (sumber kebenaran kontrak API)
- `artifacts/socmedia/public/products/` — gambar produk yang di-serve sebagai static files

## Architecture decisions

- Account data (sensitif: email/password/2FA) disimpan di GitHub repo sebagai JSON — mudah backup & audit trail via git history
- Products, Orders, Settings disimpan di PostgreSQL — butuh query/filter yang kompleks
- Payment proof (bukti bayar QRIS) disimpan sebagai base64 di DB, bukan file upload server — simpler infrastructure
- Semua `/api/accounts*` route dilindungi `requireAdmin` — data akun sangat sensitif
- Stok produk dikurangi saat order DIBUAT (bukan saat delivered) — mencegah overselling
- Stok dikembalikan saat order di-CANCEL — konsisten dengan inventory management

## Product

- **Admin Panel** (`/`) — dashboard stats, kelola akun FB/IG (CRUD via GitHub), kelola produk, pesanan, pengaturan QRIS
- **Toko Publik** (`/shop`) — browse produk, detail produk, checkout dengan QRIS, upload bukti bayar
- **Cek Pesanan** (`/shop/cek-pesanan`) — pembeli cek status pesanan dengan kode 8 karakter
- **Auth** — session-based, admin/an3dis13, protected via `requireAdmin` middleware

## User preferences

- Bahasa Indonesia untuk semua teks UI
- Harga ditampilkan format Rupiah (Rp)
- Mobile responsive design

## Gotchas

- GitHub API rate limit: 5000 req/jam per token — cukup untuk penggunaan normal
- Module-level `_sha` di github-storage.ts — concurrent writes bisa conflict; single-admin app jadi aman
- Payment proof max 5MB (divalidasi di server)
- Gambar produk disimpan di `artifacts/socmedia/public/products/` — serve sebagai static Vite files
- imageUrl produk pakai path relatif `/products/filename.png` (bukan URL absolut)
- Session cookie `secure: true` hanya di production (`NODE_ENV=production`)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
