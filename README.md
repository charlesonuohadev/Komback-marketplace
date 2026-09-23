# Komback Marketplace

Nigeria's multi-vendor marketplace — React 19 + Vite SPA, Express API, and **PostgreSQL via Prisma**.

All marketplace data (catalog, stores, orders, escrow, wallets, messages, accounts) lives in
PostgreSQL. There is **no mock or hard-coded data anywhere in the app** — every screen reads from
the API, and the API reads from the database.

---

## 1. Prerequisites

- Node.js 20+
- A PostgreSQL database (cPanel → *PostgreSQL Databases*)

## 2. Configure the database

Copy `.env.example` to `.env` and fill in your cPanel PostgreSQL credentials:

```bash
DATABASE_URL="postgresql://CPANEL_USER_DBNAME:PASSWORD@localhost:5432/CPANEL_USER_DBNAME?schema=public"
```

> cPanel names databases and users as `cpaneluser_dbname`, e.g. `komback_kombackdb`.
> Connecting from an **external** host (not the cPanel server itself)? Append
> `&sslmode=require` and enable *Remote PostgreSQL* access in cPanel.

## 3. Install, migrate, seed

```bash
npm install                 # also runs `prisma generate`
npm run prisma:migrate      # applies prisma/migrations (use prisma:push for a schema-only sync)
npm run db:seed             # loads the initial catalog, merchants, orders and content
npm run db:check            # verifies connectivity, every table, and whether the catalog is empty
```

There are two committed migrations — `20260920000000_init` (the full marketplace schema) and
`20260921000000_admin_console` (moderation fields, audit trail, password reset tokens, platform
settings). `prisma:migrate` applies both.

### Confirming the database is connected

```bash
npm run db:check
```

This prints a coloured checklist: connection + latency, PostgreSQL version, every expected table
(21 of them) with row counts, and migration state. It exits `1` and prints remediation steps when the
database is unreachable, a table is missing, or the catalog is still empty.

The same information is available over HTTP:

| Endpoint | Behaviour |
| --- | --- |
| `GET /api/health` | Always `200`. `{ status, database: "connected" \| "unavailable", databaseLatencyMs }` |
| `GET /api/health/database` | Full report. `200` when connected **and** fully migrated, otherwise `503` |

> Never prints or returns the password — the connection string is masked as
> `postgresql://user:***@host:5432/db`.

`db:seed` is safe by default: it refuses to run against a database that already has products
unless you explicitly pass `SEED_FORCE=true`.

It creates these sign-in accounts (password from `SEED_SELLER_PASSWORD`, default `ChangeMe123!`):

| Account | Email |
| --- | --- |
| Admin | `admin@komback.com` |
| Demo buyer | `buyer@komback.com` |
| Any merchant | `<store-slug>@komback.com` (e.g. `jenny-phones-gadgets@komback.com`) |

## 4. Run

```bash
npm run dev      # Express + Vite middleware on http://localhost:3000
npm run build    # prisma generate → vite build → esbuild dist/server.cjs
npm start        # production server
npm run lint     # tsc --noEmit
```

---

## Super Admin console — `/admin-cp`

A complete, code-split control centre for the whole platform, with its own authentication flow.
Visit **`/admin-cp`** (also `/admin-cp/login`, `/admin-cp/forgot-password`, `/admin-cp/reset-password`).

- **Separate auth** — `ADMIN` role only, bcrypt-verified, DB-backed session cookie, rate-limited
  (8 attempts / 10 min per IP), generic error messages to prevent account enumeration, and every
  success/failure/blocked attempt written to the audit trail.
- **Password reset** — 30-minute single-use token; requesting a new one invalidates the previous.
  Resetting a password revokes **all** of that user's sessions. When mail is not configured
  (`EMAIL_*`), non-production returns the reset URL so you can still get in.
- **11 sections** — Overview, Users, Stores, Orders, Listings, Categories, Content (blog +
  reviews), Finance (payouts + ledger), Activity, Health, Settings.

| Capability | Details |
| --- | --- |
| Users | Create / edit / delete, **ban** (with reason) / unban, force-revoke all sessions, admin notes, per-user detail view with orders and activity. Optionally delete the user's store with the account |
| Stores | Verify, suspend (with reason) / reinstate, feature, edit, delete |
| Orders | Filter by status/store, inspect line items, shipments and escrow, patch status |
| Listings | Hide/show, feature, edit price and stock, delete |
| Categories | Full CRUD with sort order and icon/image |
| Content | Blog posts CRUD, review moderation (hide / delete) |
| Finance | Payout approvals (rejecting returns the funds to the store wallet), manual wallet adjustments, full transaction ledger with search and totals |
| Settings | Maintenance mode, registration/listing switches, support contacts, featured-category limit, live escrow waybill pricing |
| Health | Database connectivity, latency, per-table row counts, migration state, queue/order counters |

Behaviour that makes it genuinely "in control":

- **Banned users are blocked at the middleware layer** — their sessions are deleted and every
  subsequent `/api/*` call is rejected, not just hidden in the UI.
- **Suspended stores** disappear from the public catalog; **hidden** products and reviews are
  excluded from all storefront queries.
- **Maintenance mode** is served through `GET /api/config` (no redeploy needed).
- `/admin-cp` is excluded from indexing everywhere (`noindex, nofollow` + `Disallow` in `robots.txt`).

### Audit trail

Every meaningful action — sign-in success/failure/blocked, logout, registration, profile changes,
cart and wishlist changes, order placement, dispatch, escrow release, product create/update/delete,
catalog import, store updates, payout requests, waybills, messages and reviews — is written to
`AuditLog` by `recordAudit()` in `server/audit.ts`.

`AuditLog.actorId` is deliberately **not** a foreign key, so deleting a user never erases history.
Auditing is best-effort: a failure to write an audit row is logged and swallowed rather than
breaking the request. The Activity section offers filtering by category, action, actor and date
range, plus per-category totals.

---

## SEO / GEO

The storefront is a SPA, so the server renders the metadata instead of relying on JavaScript:

- `server/seo.ts` resolves **route-specific** title, description, keywords, canonical, robots,
  Open Graph, Twitter card and schema.org JSON-LD for `/`, `/products`, `/deals`, `/stores`,
  `/blog`, `/blog/:slug`, `/sell`, `/about-us`, `/safety`, `/category/:slug`, `/:product-slug`
  (`Product` + `Offer` incl. price, currency, availability and aggregate rating) and
  `/store/:id` (`OnlineStore`).
- The HTML shell carries `%SEO_*%` tokens that the server substitutes per request, so a crawler
  receives complete markup without executing any JavaScript. Resolved metadata is cached in memory
  for 60 seconds to keep crawler traffic off PostgreSQL.
- **Machine-readable endpoints** — `/robots.txt` (explicitly allows GPTBot, ClaudeBot,
  PerplexityBot and Google-Extended, disallows the admin console and private pages),
  `/sitemap.xml` (static routes + every category, product, store and published article with
  `lastmod`) and `/llms.txt` (a GEO summary of what Komback is, its currency and escrow model, and
  the canonical URLs an answer engine should cite).
- **Geo signals** — `lang="en-NG"`, `geo.region`, `geo.placename`, `og:locale`, `areaServed`,
  `addressCountry: NG`, `priceCurrency: NGN`.
- **Client-side navigation** — `src/components/SeoHead.tsx` calls `GET /api/seo?path=…` after
  in-app navigation and updates the head plus the JSON-LD node, so the tab title, description and
  canonical URL always match the visible page.
- Private routes (`/account`, `/cart`, `/wishlist`) are `noindex, follow`; `/admin-cp` is
  `noindex, nofollow`. A `<noscript>` block gives crawlers and text browsers a real H1 and summary.

> Set `APP_URL` to your public origin — canonical URLs, Open Graph URLs, `robots.txt` and
> `sitemap.xml` are all built from it.

---

## Architecture

```
prisma/
  schema.prisma          # single source of truth for the data model
  migrations/            # committed SQL migrations
  seed.ts                # initial data loader
  seed-data/             # the marketplace's starting catalog & content
server/
  index.ts               # express bootstrap, SEO-rendered HTML, static/Vite serving, error handling
  db.ts                  # PrismaClient singleton
  auth.ts                # bcrypt passwords, DB-backed sessions, guest identity, requireAdmin
  audit.ts               # recordAudit() — the platform-wide audit trail
  diagnostics.ts         # inspectDatabase() / quickHealth() — connectivity + table report
  db-check.ts            # CLI behind `npm run db:check`
  mailer.ts              # pluggable transactional email (logs when unconfigured)
  rateLimit.ts           # rolling-window limiter for admin auth endpoints
  seo.ts                 # per-route metadata, JSON-LD, sitemap.xml, robots.txt, llms.txt
  serializers.ts         # Prisma rows → API DTOs (shapes match src/types.ts)
  constants.ts           # states, banks, couriers, shipping fees
  woocommerce.ts         # live komback.com REST catalog import
  routes/                # auth, catalog, cart, orders, seller, payments, messages
  routes/admin-auth.routes.ts  # /api/admin/auth — login, logout, forgot/reset password
  routes/admin.routes.ts       # the guarded /api/admin surface (~40 endpoints)
src/
  lib/api.ts             # typed client for /api/*
  admin/adminApi.ts      # typed client for /api/admin/*
  admin/AdminApp.tsx     # /admin-cp shell (sidebar routing, session gate, lazy-loaded)
  admin/ui.tsx           # dependency-free admin UI kit (tables, charts, modals, toasts)
  admin/sections/        # the 11 console sections
  components/SeoHead.tsx # keeps <head> + JSON-LD in sync during SPA navigation
  context/AppContext.tsx # app-wide data provider (catalog, cart, wishlist, auth)
  components/, pages/    # UI — consumes the API only
```

### Data model highlights

- **Identity** — `User` (BUYER / SELLER / ADMIN), `Session`. Passwords are bcrypt-hashed; sessions
  are database rows behind an httpOnly cookie.
- **Catalog** — `Category`, `Store`, `Product`, `Review`, `BlogPost`.
- **Commerce** — `Order` + `OrderItem`, `Shipment` + `ShipmentEvent`, `CartItem`, `WishlistItem`.
- **Money** — `Wallet`, `Transaction`, `PayoutRequest`. Amounts are whole Naira (`Int`).
- **Messaging** — `MessageThread` + `Message` (buyer ↔ seller).
- **Governance** — `AuditLog` (append-only activity trail), `PasswordResetToken`,
  `PlatformSetting` (key/JSON value, editable at runtime).
- **Moderation flags** — `User.isBanned/bannedAt/banReason/bannedById/adminNotes`,
  `Store.isSuspended/suspendReason/isFeaturedStore`, `Product.isHidden`, `Review.isHidden`.

Carts and wishlists are keyed by `ownerKey` — the user id when signed in, otherwise a signed
cookie identifier. Guest rows are merged into the account on login.

### Order lifecycle

```
checkout            → order created (ESCROW_SECURED), escrow locked in Store wallet
PATCH /status       → DISPATCHED / OUT_FOR_DELIVERY (creates Shipment + events)
POST /verify-pin    → RELEASED, escrow moves to available balance, store salesCount++
GET  /api/track/:no → public waybill tracking (handover PIN masked unless you own the order)
```

---

## API reference

All routes are prefixed with `/api`.

| Area | Endpoints |
| --- | --- |
| Health / config | `GET /health`, `GET /health/database`, `GET /config`, `GET /platform-stats` |
| SEO | `GET /api/seo?path=/…`, `GET /robots.txt`, `GET /sitemap.xml`, `GET /llms.txt` (last three are served at the site root, not under `/api`) |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PATCH /auth/me` |
| Reference | `GET /locations` (states, banks, couriers, conditions, shipping fees) |
| Catalog | `GET /categories`, `GET /products`, `GET /products/:idOrSlug`, `GET /stores`, `GET /stores/:idOrSlug`, `GET /blog`, `GET /blog/:idOrSlug`, `GET /stats` |
| Reviews | `GET /products/:idOrSlug/reviews`, `POST /products/:idOrSlug/reviews`, `GET /reviews/recent` |
| Cart | `GET/POST /cart`, `PATCH/DELETE /cart/:productId`, `DELETE /cart` |
| Wishlist | `GET /wishlist`, `POST /wishlist/toggle` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:orderNumber`, `GET /track/:orderNumber`, `PATCH /orders/:orderNumber/status`, `POST /orders/:orderNumber/verify-pin` |
| Seller | `GET/PATCH /seller/store`, `GET /seller/stats`, `GET /seller/orders`, `GET /seller/wallet`, `POST /seller/wallet/payouts`, `GET /seller/messages`, `POST /seller/messages/:threadId/reply`, `GET /seller/logistics`, `POST /seller/logistics/waybill`, `GET /seller/logistics/rate`, `POST/PATCH/DELETE /seller/products` |
| Import | `POST /seller/woocommerce/sync` — pulls the live komback.com catalog into PostgreSQL |
| Messaging | `POST /messages/threads`, `GET /messages/threads`, `POST /messages/threads/:threadId/messages` |
| Payments | `POST /paystack/initialize`, `GET /paystack/verify/:reference`, `POST /flutterwave/initialize`, `GET /flutterwave/verify/:reference`, `POST /payments/record` |
| Admin auth | `GET /admin/auth/session`, `POST /admin/auth/login`, `POST /admin/auth/logout`, `POST /admin/auth/forgot-password`, `POST /admin/auth/reset-password` |
| Admin console | `GET /admin/overview`, `GET /admin/system/health`, `GET /admin/activity`, `GET/POST/PATCH/DELETE /admin/users`, `POST /admin/users/:id/ban\|unban\|revoke-sessions`, `GET/PATCH/DELETE /admin/stores` + verify/suspend/reinstate, `GET/PATCH /admin/orders`, `GET/PATCH/DELETE /admin/products`, `/admin/categories`, `/admin/blog`, `/admin/reviews`, `/admin/transactions`, `/admin/payouts/:id/:decision`, `/admin/wallets/:storeId/adjust`, `GET/PATCH /admin/settings` |

Everything under `/api/admin/*` (except `/api/admin/auth/*`) is guarded by `requireAdmin`, which
requires an authenticated session whose user has the `ADMIN` role.

Payment gateways run in a clearly-labelled sandbox mode when their secret key is not configured;
a configured key always triggers a real API call.

---

## Deploying to cPanel (Application Manager / Passenger)

1. Upload the project (without `node_modules` and `dist`).
2. Create `.env` with `DATABASE_URL` (plus gateway keys and `APP_URL`).
3. In a terminal on the server (or via *Setup Node.js App*):

   ```bash
   npm install                # runs prisma generate via postinstall
   npm run prisma:migrate     # creates all tables (both migrations)
   npm run db:check           # confirms the connection, tables and migration state
   npm run db:seed            # optional: initial catalog
   npm run build              # builds dist/ and dist/server.cjs
   ```

4. Point Application Manager at `app.js` (it boots `dist/server.cjs`). Startup file, port and
   `NODE_ENV` are all handled automatically — Passenger injects `PORT` and the bundle detects
   production by running as CommonJS.

**Notes**

- `prisma` is a runtime dependency on purpose, so `postinstall` can generate the client even when
  devDependencies are not installed.
- `dist/` is git-ignored and must be built on the server.
- The API returns `503` with a setup hint if `DATABASE_URL` is missing or unreachable —
  `GET /api/health` reports `{ "database": "connected" | "unavailable" }` for monitoring.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (**required**) |
| `APP_URL` | Public URL, used for payment redirects |
| `PORT` | Injected by Passenger; defaults to 3000 |
| `PRISMA_LOG` | `true` to log every SQL query (development only) |
| `PAYSTACK_PUBLIC_KEY` / `PAYSTACK_SECRET_KEY` | Paystack (sandbox mode when unset) |
| `FLUTTERWAVE_PUBLIC_KEY` / `FLUTTERWAVE_SECRET_KEY` | Flutterwave (sandbox mode when unset) |
| `WOOCOMMERCE_BASE_URL` | Default base URL for the catalog importer |
| `EMAIL_API_URL` / `EMAIL_API_KEY` / `EMAIL_FROM` | Transactional email for admin password resets. Without these the message is logged instead of sent (and non-production returns the reset URL) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_SELLER_PASSWORD` | Seed accounts |
| `SEED_FORCE` | `true` allows re-seeding a populated database |
