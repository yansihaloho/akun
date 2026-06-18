# SocMedia Ops

Social media account management system — manage Facebook/Instagram accounts, sell them via a shop with QRIS payment, and track orders.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, path `/api`)
- `pnpm --filter @workspace/socmedia run dev` — run the frontend (port 25882, path `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — session signing secret (already set)
- Required env: `GITHUB_PERSONAL_ACCESS_TOKEN` — for reading/writing accounts in GitHub repo

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + connect-pg-simple
- DB: PostgreSQL + Drizzle ORM (products, orders, settings, sessions)
- Account storage: GitHub API (`yansihaloho/akun` repo, `data/accounts.json`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Frontend: React + Vite + Tailwind + shadcn/ui + wouter
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/` — Express API server
- `artifacts/socmedia/` — React/Vite frontend (admin dashboard + public shop)
- `lib/db/src/schema/` — DB tables: products, orders, settings, auth/sessions
- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validators
- `lib/replit-auth-web/` — `useAuth()` hook

## Architecture decisions

- Accounts stored in GitHub (`yansihaloho/akun` repo at `data/accounts.json`) — no DB table for accounts
- Products, orders, and settings stored in PostgreSQL via Drizzle ORM
- Session-based auth with hardcoded admin credentials (username: `admin`)
- Public shop routes (`/shop/*`) require no auth; admin routes require session
- QRIS image stored as base64 in the `settings` table

## Product

- **Admin dashboard**: manage Facebook/Instagram accounts, products, orders, settings
- **Public shop**: browse products, checkout, upload payment proof, check order status
- **Account import**: bulk CSV import of social media account credentials
- **Shop features**: QRIS payment display, WhatsApp contact, order tracking by code

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `GITHUB_PERSONAL_ACCESS_TOKEN` must have write access to `yansihaloho/akun` repo
- Account operations hit GitHub API on every request (no local cache beyond the SHA for writes)
- Session store uses `sessions` table in PostgreSQL; run `db push` after first setup
- Admin credentials: username=`admin`, password=`an3dis13` (hardcoded in `artifacts/api-server/src/lib/auth.ts`)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
