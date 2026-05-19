# revers-mf — Maintainer & Developer Guide

A long-form companion to the [README](./README.md). Read this first if you need to debug, change, or extend any part of the Weight Trend Tracker — and especially if you are an AI coding assistant working on this repo. Everything you need to know that is *not* a 30-second copy-paste lives here.

> **TL;DR**: this is a single-user Next.js (App Router, RSC) weight tracker on Vercel + Neon Postgres. Scale weights are stored in `WeightEntry`. The dashboard computes an EWMA(α=0.1) trend with linear interpolation entirely in memory in `utils/analytics.ts`. The KPI numbers match MacroFactor's UI exactly because the "Difference" subtracts the *rounded* trend endpoints — that detail is the cause of every subtle bug in the past, so don't undo it.

---

## Table of contents

1. [Product surface](#1-product-surface)
2. [Tech stack](#2-tech-stack)
3. [Repository layout](#3-repository-layout)
4. [Routing and rendering model](#4-routing-and-rendering-model)
5. [Data model and Prisma schemas](#5-data-model-and-prisma-schemas)
6. [Authentication and session](#6-authentication-and-session)
7. [The analytics engine — `utils/analytics.ts`](#7-the-analytics-engine--utilsanalyticsts)
8. [KPI math — exactly how it matches MacroFactor](#8-kpi-math--exactly-how-it-matches-macrofactor)
9. [Local development](#9-local-development)
10. [Testing with Playwright](#10-testing-with-playwright)
11. [Database operations](#11-database-operations)
12. [Importing data](#12-importing-data)
13. [Vercel deployment](#13-vercel-deployment)
14. [Operations playbook](#14-operations-playbook)
15. [Extending the app](#15-extending-the-app)
16. [Known quirks and gotchas](#16-known-quirks-and-gotchas)
17. [Conventions for AI assistants](#17-conventions-for-ai-assistants)
18. [Progressive Web App (PWA)](#18-progressive-web-app-pwa)

---

## 1. Product surface

The app is a mobile-first single-page-feel web app with three screens behind a login:

| Path | Component | Purpose |
|------|-----------|---------|
| `/login` | `app/login/page.tsx` + `components/login-form.tsx` | Username + password authentication |
| `/scale-weight` | `app/scale-weight/page.tsx` | Browse / add / edit / delete logged scale weights |
| `/weight-trend` | `app/weight-trend/page.tsx` | Dashboard: KPIs, period filters, Recharts line chart, daily-breakdown table |
| `/weight-trend/logs` | `app/weight-trend/logs/page.tsx` | A vertical list of every day's trend with delta |

The root `/` redirects to `/weight-trend` if logged in, else `/login`. Auth-gating is enforced by `middleware.ts` on every non-public path.

The dashboard supports six period filters: **1W, 1M, 3M, 6M, 1Y, All**, each with an "Average" KPI and a "Difference" KPI.

---

## 2. Tech stack

| Layer | Choice | Where to look |
|-------|--------|---------------|
| Framework | Next.js 16 App Router (RSC + Server Actions) | `app/**`, `lib/actions/**` |
| Language | TypeScript 5 (strict) | `tsconfig.json` |
| Styling | Tailwind CSS v4 + Radix UI primitives + Lucide icons | `app/globals.css`, `components/ui/**` |
| Charts | Recharts | `components/weight-trend/weight-chart.tsx` |
| ORM | Prisma 6 | `prisma/**`, `lib/prisma.ts` |
| DB (local) | SQLite | `prisma/schema.sqlite.prisma` |
| DB (prod) | Vercel Postgres (Neon) | `prisma/schema.prisma` |
| Auth | bcryptjs + signed HMAC session cookie | `lib/session.ts`, `lib/actions/auth.ts` |
| Validation | Zod | `lib/actions/weight-entries.ts` |
| Testing | Playwright (Chromium) | `tests/**`, `playwright.config.ts` |
| Excel import | `xlsx` package | `scripts/import-macrofactor.ts` |
| Analysis | Python + openpyxl (dev-only) | `scripts/analyze_mf.py` |
| Deployment | Vercel | `vercel.json` |
| Runtime | Node 24 via NVS | `.nvmrc` |

> **⚠️ This Next.js is non-standard.** `AGENTS.md` notes that this version may have breaking changes from your training data. Read `node_modules/next/dist/docs/` before adding routing features. In particular: server `searchParams` are now a `Promise<…>` and must be `await`-ed.

---

## 3. Repository layout

```
revers-mf/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (fonts, body classes)
│   ├── page.tsx                      # / → redirects based on session
│   ├── globals.css                   # Tailwind setup
│   ├── login/page.tsx                # Login screen
│   ├── scale-weight/page.tsx         # Scale weight CRUD screen
│   └── weight-trend/
│       ├── page.tsx                  # Dashboard (reads ?asOf= for tests)
│       └── logs/page.tsx             # Daily trend list
├── components/
│   ├── layout/app-header.tsx         # Shared sticky header with back/title/right-action
│   ├── login-form.tsx                # Client-side login form
│   ├── scale-weight/                 # Entry list, add/edit dialog
│   ├── ui/                           # Radix-based primitives (button, dialog, …)
│   └── weight-trend/                 # Dashboard pieces
│       ├── weight-trend-shell.tsx    # Outer wrapper with header + tutorial overlay
│       ├── dashboard-client.tsx      # Owns window state, recomputes KPIs
│       ├── kpi-summary.tsx           # Average / Difference cards
│       ├── period-filter.tsx         # 1W/1M/3M/6M/1Y/All pill row
│       ├── weight-chart.tsx          # Recharts LineChart
│       ├── daily-breakdown-table.tsx # Table inside dashboard
│       ├── trend-log-list.tsx        # Used by /weight-trend/logs
│       └── tutorial-banner.tsx       # Onboarding overlay
├── lib/
│   ├── prisma.ts                     # PrismaClient singleton (hot-reload safe)
│   ├── session.ts                    # Signed cookie session
│   ├── utils.ts                      # cn() helper (clsx + tailwind-merge)
│   └── actions/
│       ├── auth.ts                   # loginAction, logoutAction
│       └── weight-entries.ts         # upsertWeightEntry, deleteWeightEntry
├── utils/
│   └── analytics.ts                  # ★ EWMA, interpolation, KPI math, formatting
├── middleware.ts                     # Session-cookie gate on every non-public route
├── prisma/
│   ├── schema.prisma                 # Postgres schema (prod)
│   ├── schema.sqlite.prisma          # SQLite schema (local/tests)
│   ├── seed.ts                       # Production-style seed (~30 sample days)
│   ├── seed-test.ts                  # Playwright fixtures: default/ewma/gap/macrofactor
│   └── migrations/                   # Postgres migration history
├── scripts/                          # One-off CLIs (not used by the app at runtime)
│   ├── import-macrofactor.ts         # Parse MF Excel → DB (with date alignment)
│   ├── analyze_mf.py                 # Python regression against MF's trend column
│   ├── verify-kpis.ts                # TS sanity check against the MF fixture
│   ├── setup-prod-user.ts            # Idempotent: ensure username column + prod creds
│   ├── check-db.ts / check-db-prod.ts# DB inspection
│   └── macrofactor-logged.json       # 443-entry fixture used by tests + verify
├── tests/
│   ├── weight-tracker.spec.ts        # Smoke + EWMA + interpolation + UI
│   ├── macrofactor-kpis.spec.ts      # All 6 KPI windows against MF reference values
│   └── production-smoke.spec.ts      # Same assertions against the live Vercel URL
├── playwright.config.ts              # Conditional webServer (skipped for remote URLs)
├── vercel.json                       # buildCommand for Vercel
├── package.json                      # Scripts; "prisma" key still present (deprecated warn)
├── README.md
└── MAINTAINING.md                    # ← you are here
```

---

## 4. Routing and rendering model

### Server components vs client components

Every `page.tsx` is a **React Server Component**. It reads the session, queries Prisma, builds the daily series in memory with `buildDailySeries`, and hands plain serializable data to a client wrapper.

Client components live under `components/**` and are marked with `"use client"`. They never call Prisma directly — they always go through a **Server Action** in `lib/actions/**`.

Server Actions used:

| Action | Purpose | Revalidates |
|--------|---------|-------------|
| `loginAction(formData)` | Validate username + password, set session cookie, redirect | n/a |
| `logoutAction()` | Clear session, redirect to `/login` | n/a |
| `upsertWeightEntry(formData)` | Validate + upsert by `(userId, date)` | `/weight-trend`, `/scale-weight`, `/weight-trend/logs` |
| `deleteWeightEntry(id)` | Scoped delete | same three paths |

### Middleware

`middleware.ts` runs on every request that doesn't match the matcher exclusions. It:

1. Lets static asset paths and `/login` through.
2. Reads the `session` cookie. If missing → 302 to `/login`.
3. Does **not** validate the cookie signature (that's done by `getSessionUserId` in pages/actions). The middleware is a fast gate only.

> If you need an admin-only route or per-user roles later, this is where you'd add the check.

### Determinism for tests: `?asOf=YYYY-MM-DD`

`app/weight-trend/page.tsx` accepts an `asOf` query param. When present (and well-formed `YYYY-MM-DD`), it overrides the "today" used by `buildDailySeries` and `computeKpis`. Tests pass `?asOf=2026-05-18` so the assertions are time-invariant. Production users do not pass this param and get `new Date()`.

---

## 5. Data model and Prisma schemas

There are **two** Prisma schemas, kept in sync **manually**. Always edit both.

```prisma
// prisma/schema.prisma (Postgres)
model User {
  id            String        @id @default(uuid())
  username      String        @unique
  passcodeHash  String        // legacy field name — stores bcrypt(password)
  name          String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  weightEntries WeightEntry[]
}

model WeightEntry {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date      DateTime // ★ always UTC midnight — see "Date hygiene" below
  weight    Float    // kilograms
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, date])
  @@index([userId, date(sort: Asc)])
}
```

The SQLite schema is identical except `provider = "sqlite"`, `url = env("DATABASE_URL")`, and `Float` is the SQLite equivalent.

### Field semantics

- **`passcodeHash`** — name is legacy; it holds `bcrypt.hash(password, 10)`. Don't rename without a migration.
- **`username`** — stored lowercase, looked up lowercase. `loginAction` lowercases the input.
- **`date`** on `WeightEntry` — **always UTC midnight**. The unique index assumes this. If you store anything else (e.g. local-time midnight, or noon UTC), you'll create duplicate rows for the same calendar day and the daily series will be wrong.

### Date hygiene — the foot-gun that bit us before

`xlsx` with `cellDates: true` returns JavaScript `Date` objects whose **wall-clock** time is the spreadsheet's date at local midnight. In UTC+3 that means `2024-10-31` becomes `2024-10-30T21:00:00Z`. Doing `getUTCFullYear/Month/Date` on that gives `2024-10-30` and shifts the whole series back a day.

Always normalize using **local** Y/M/D and rebuild as UTC midnight:

```ts
new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
```

`excelToDate` in `scripts/import-macrofactor.ts` does this. `normalizeDate` in `utils/analytics.ts` is the canonical helper inside the app.

---

## 6. Authentication and session

### Login flow

1. `LoginForm` (client) submits `{ username, password }` to `loginAction`.
2. `loginAction` lowercases the username, looks up the user, and `bcrypt.compare`s the password.
3. On success, `createSession(user.id)` is called and the user is redirected to `/weight-trend`.
4. The session is an **HMAC-signed JSON blob** in an `httpOnly`, `sameSite=lax` cookie called `session`. The signing key is `SESSION_SECRET`. Cookie lifetime is 1 year.

The error message is intentionally generic ("Invalid username or password") to avoid leaking which half is wrong.

### Reading the session

Server code uses `await getSessionUserId()` from `lib/session.ts`. It:

- Reads the cookie via `next/headers`.
- Splits on `.` to get `<base64url payload>.<hex signature>`.
- Reverifies the HMAC. Mismatch → returns `null`.
- Parses the payload and returns `userId`.

Pages call this at the top and `redirect("/login")` on `null`.

### Production credentials

The Vercel deployment has one user with `username = "admin"`. To change the password (or rotate any field), run:

```powershell
# Load env vars from .env.local first (see Operations playbook)
$env:PROD_USERNAME = "admin"
$env:PROD_PASSWORD = "new-password-here"
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"   # only if your network needs it
npx tsx scripts/setup-prod-user.ts
```

This script is **idempotent** — it can be re-run safely. It ensures the `username` column exists, backfills missing values, and upserts the credentials.

---

## 7. The analytics engine — `utils/analytics.ts`

This is the most important file in the repo. Touch carefully.

### Public surface

| Export | Purpose |
|--------|---------|
| `EWMA_ALPHA = 0.1` | The smoothing factor. Do **not** change without a regression test. |
| `normalizeDate(date)` | Strip wall-clock time, return UTC midnight. |
| `toDateKey(date)` | `YYYY-MM-DD` string keyed for maps. |
| `buildDailySeries(entries, today?)` | Build a continuous daily series with EWMA + linear interpolation. |
| `sliceByWindow(points, window, today?)` | Filter to the last N days for the requested window. |
| `computeKpis(allPoints, _logged, window, today?)` | Average + Difference + dateRangeLabel + sliced points. |
| `getChartDomain(points)` | Y-axis min/max/ticks for the chart. |
| `formatDateRange`, `formatDisplayDate`, `formatTrendDelta` | UI strings. |

### Algorithm — step by step

Given a list of logged `{ date, weight }` entries:

1. **Sort + dedupe by day** — collapse to a map keyed by `YYYY-MM-DD`.
2. **Compute the calendar span** — `start = first logged day`, `end = today` (or override). Build a slot per calendar day in between, inclusive.
3. **Fill scales** — for each day:
   - If logged → use that value, mark `interpolated = false`.
   - Else if has both a prior and a future logged day → **linear interpolation** between them by day offset.
   - Else copy the nearest available value (clamp at the ends).
4. **Run EWMA** — iterate day-by-day:
   - Day 0: `trend = scale` (seed at first scale).
   - Day i > 0: `trend = α * scale + (1 - α) * prevTrend` with `α = 0.1`.
   - Store both raw `trend` and `trendRounded = Math.round(trend * 10) / 10`.
   - Store `trendDelta = trend - prevTrend`.

Each daily point has shape:

```ts
type DailyPoint = {
  date: Date;                  // UTC midnight
  scale: number;               // logged or interpolated
  scaleIsInterpolated: boolean;
  trend: number;               // raw EWMA
  trendRounded: number;        // display value, 1 decimal
  trendDelta: number;          // change from previous day's trend
};
```

### Why interpolation, not "freeze the trend"

Some weight trackers freeze the EWMA on missing days. We don't. MacroFactor doesn't either. With interpolation, a logging gap doesn't artificially flatten the trend — the user's actual weight loss during the gap is still reflected by the surrounding logged anchors. This is what makes our trend match MF's within 0.003 kg mean absolute error.

---

## 8. KPI math — exactly how it matches MacroFactor

> **Read this section before changing anything in `computeKpis`.** The current behavior was reverse-engineered against MacroFactor's own Excel export and asserted by Playwright. Quiet little changes here have caused every single regression so far.

### "Average"

Mean of the **daily trend** values in the window (including interpolated days). **Not** the mean of logged scales — that skews high during logging gaps. Rounded once at the end to 1 decimal.

### "Difference"

```ts
firstTrendRounded = Math.round(firstTrend * 10) / 10
lastTrendRounded  = Math.round(lastTrend  * 10) / 10
difference        = lastTrendRounded - firstTrendRounded   // then re-rounded
```

**The rounding happens on each endpoint before the subtraction**, not after. This is the MacroFactor-matching behavior. If you do `Math.round((last - first) * 10) / 10` you'll get off-by-0.1 errors for windows whose endpoints sit near a `.5` boundary (e.g. 6M will read `-3.7` instead of `-3.8`).

### Window lengths

`sliceByWindow` uses N-day-inclusive windows ending today:

| Window | N days inclusive | Start day (with today = May 18, 2026) |
|--------|-----------------:|----------------------------------------|
| 1W  | 7   | May 12 |
| 1M  | 30  | Apr 19 |
| 3M  | 90  | Feb 18 |
| 6M  | 180 | Nov 20, 2025 |
| 1Y  | 365 | May 19, 2025 |
| All | (entire series) | first logged day |

### Reference values on the 565-day MacroFactor fixture

These are the ground-truth values asserted by `tests/macrofactor-kpis.spec.ts`. All match MF's UI exactly except "All" (see the note in §16).

| Window | Avg (kg) | Diff (kg) |
|--------|---------:|----------:|
| 1W     | 95.8     | -0.5      |
| 1M     | 96.0     | -0.7      |
| 3M     | 96.5     | -1.2      |
| 6M     | 97.1     | -3.8      |
| 1Y     | 100.7    | -13.9     |
| All    | 107.0    | -29.9 (MF UI shows -30.0 — see §16) |

### How we verified the algorithm

`scripts/analyze_mf.py` parses the MacroFactor `.xlsx` correctly (treating the `Trend Weight` column as a continuous 565-day daily series, **not** row-aligned to the sparse `Date` + `Scale Weight` columns), runs the EWMA(0.1) with linear interpolation on the calendar-aligned data, and compares each day's computed trend to MF's exported trend. The result: **mean absolute error 0.0032 kg**, max 0.05 kg (only at the seed). That's our proof the algorithm is right.

If you ever doubt the algorithm or need to re-verify against a new export:

```powershell
python scripts\analyze_mf.py "C:\path\to\MacroFactor-export.xlsx"
```

---

## 9. Local development

Use **NVS** to manage Node (the repo pins `.nvmrc`). On Windows PowerShell:

```powershell
$env:NVS_HOME = "$env:LOCALAPPDATA\nvs"
. "$env:NVS_HOME\nvs.ps1"
nvs add lts
nvs use lts
```

Then:

```powershell
npm install
copy .env.example .env

npm run db:generate:local
npm run db:push:local
npm run db:seed

npm run dev
```

Open http://localhost:3000. Default local credentials: **admin / 1234**.

### `.env` files — what goes where

| File | Purpose | Committed? |
|------|---------|------------|
| `.env.example` | Template (no secrets) | yes |
| `.env`  | Local dev defaults (SQLite URL + seed values) | **no** |
| `.env.local` | Vercel-pulled env vars (Postgres URLs, OIDC token). Used by import + setup scripts. | **no** |
| `.env.production` | Vercel-pulled production env. | **no** |

All of `.env`, `.env.local`, `.env.production`, `.env*.local` are gitignored.

### npm scripts cheatsheet

| Script | What it does |
|--------|--------------|
| `npm run dev` | Regen SQLite client → start Next dev server |
| `npm run build` | Postgres path: `prisma generate → prisma migrate deploy → next build` |
| `npm run db:generate:local` | Generate Prisma client against `schema.sqlite.prisma` |
| `npm run db:generate:prod` | Generate against `schema.prisma` (Postgres) |
| `npm run db:push:local` | Push SQLite schema (no migrations file) |
| `npm run db:seed` | Run `prisma/seed.ts` (creates admin + ~30 days of fake data) |
| `npm run db:seed:test` | Run `prisma/seed-test.ts default` (Playwright base fixture) |
| `npm run test:e2e` | Playwright |
| `npm run lint` | ESLint |

> Both `db:generate:local` and `db:push:local` use `cross-env DATABASE_URL=file:./prisma/dev.db` so they don't accidentally read the Postgres URL from a sourced `.env.local`.

---

## 10. Testing with Playwright

### Test specs

| File | What it covers |
|------|----------------|
| `tests/weight-tracker.spec.ts` | Smoke: login + add entry, EWMA math with out-of-order entries, interpolation chart points, period-filter UI |
| `tests/macrofactor-kpis.spec.ts` | Seeds the 443-entry MF dataset and asserts all six KPI windows |
| `tests/production-smoke.spec.ts` | Same KPI assertions against the live Vercel URL (no webServer) |

### Configuration (`playwright.config.ts`)

- Single worker, single project (Chromium desktop).
- `baseURL` defaults to `http://localhost:3000` but reads `PLAYWRIGHT_BASE_URL`.
- **`webServer` is conditional** — disabled when `PLAYWRIGHT_BASE_URL` points at a remote `https://` host. Local runs spin up `npm run dev` with explicit env vars.

### Running tests

```powershell
# Local (uses SQLite, starts dev server automatically)
npx playwright test
npx playwright test tests/macrofactor-kpis.spec.ts --reporter=list

# Production (against the deployed Vercel app)
$env:PLAYWRIGHT_BASE_URL = "https://revers-mf.vercel.app"
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"   # only if your network needs it
$env:PROD_USERNAME = "admin"
$env:PROD_PASSCODE = "Amdocs101"
npx playwright test tests/production-smoke.spec.ts
```

### Important `data-testid`s

When changing UI, preserve these or update the tests:

- `passcode-input` ← legacy (kept removed). Now: `username-input`, `password-input`, `login-submit`
- `kpi-summary`, `kpi-average`, `kpi-difference`, `kpi-date-range`
- `filter-1W` … `filter-All`
- `weight-chart`, `chart-point`
- `trend-<YYYY-MM-DD>`, `scale-<YYYY-MM-DD>`, `delta-<YYYY-MM-DD>`, `row-<YYYY-MM-DD>`
- `add-entry-button`, `weight-input`, `date-input`, `save-entry`, `entry-<id>`

### Seed modes (`prisma/seed-test.ts`)

```bash
npx tsx prisma/seed-test.ts default      # 14 fake days
npx tsx prisma/seed-test.ts ewma         # 3 entries for math tests
npx tsx prisma/seed-test.ts gap          # gappy data for interpolation test
npx tsx prisma/seed-test.ts macrofactor  # 443 real entries from MF
```

All modes wipe the DB first (`deleteMany` users + entries) and create a `test-user` with username `admin` and password `1234`.

---

## 11. Database operations

### Two schemas, one client

`@prisma/client` is generated from **whichever schema you last ran `prisma generate` against**. Whenever you switch contexts, regenerate. The most common confusion is "I'm seeing Postgres errors but I'm targeting SQLite" — that means the wrong client is loaded.

Rule of thumb:

- Before running anything against **Vercel Postgres** (import, setup, check): `npm run db:generate:prod`.
- Before running **local dev / Playwright**: `npm run db:generate:local`.

### Loading env vars from `.env.local` in PowerShell

The Postgres URLs are in `.env.local`. To load them into the current shell:

```powershell
$envContent = Get-Content .env.local
foreach ($line in $envContent) {
  if ($line -match '^([A-Z_]+)="(.*)"$') {
    Set-Item -Path "env:$($matches[1])" -Value $matches[2]
  }
}
```

After this `POSTGRES_PRISMA_URL` is set and Prisma will connect to Neon.

When you're done, clear them so local tests don't get confused:

```powershell
Remove-Item env:DATABASE_URL,env:POSTGRES_PRISMA_URL,env:POSTGRES_URL_NON_POOLING,env:POSTGRES_URL -ErrorAction SilentlyContinue
```

### Inspecting either DB

`scripts/check-db.ts` and `scripts/check-db-prod.ts` count rows and print first/last entries. Use them as templates for ad-hoc queries — they're tiny.

### Migrations

Migrations live in `prisma/migrations/` and apply only to Postgres. The build command on Vercel runs `prisma migrate deploy`. SQLite is managed with `prisma db push` (no migration files).

**To add a new migration**:

1. Edit both schemas (`schema.prisma` *and* `schema.sqlite.prisma`).
2. Generate the Postgres migration file:
   ```powershell
   # Make sure POSTGRES_PRISMA_URL is set in your shell
   npx prisma migrate dev --schema=prisma/schema.prisma --name <descriptive_name>
   ```
   Or, if you're working offline, hand-author the SQL in a new `prisma/migrations/<timestamp>_<name>/migration.sql` file.
3. Apply locally: delete `prisma/prisma/dev.db` and run `npm run db:push:local`. (SQLite doesn't read the migration files.)
4. Commit + push. Vercel will run `prisma migrate deploy` during the next build.

> **Heads-up — destructive migrations.** Prisma will refuse to drop or rename columns without explicit consent. For non-destructive additions (a new nullable column, a new index, etc.) you're fine.

### The "migration was already applied manually" recovery

If you apply schema changes out-of-band (e.g. via `scripts/setup-prod-user.ts` using `ADD COLUMN IF NOT EXISTS`), Prisma will fail the next deploy because the migration's own SQL fails (the column already exists). Recover with:

```powershell
npx prisma migrate resolve --schema=prisma/schema.prisma --applied <migration_folder_name>
```

This marks the migration as successfully applied in the `_prisma_migrations` table without re-running its SQL.

---

## 12. Importing data

### From a MacroFactor `.xlsx` export

```powershell
# Load Postgres env vars (see §11)
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
npx tsx scripts/import-macrofactor.ts "C:\path\to\MacroFactor-export.xlsx" --reset
```

The `--reset` flag wipes the user's existing `WeightEntry` rows first. Without it, the script upserts only.

**The script intentionally ignores MF's `Trend Weight` column** when importing. Trends are computed by our app — we only store the raw scale logs. The trend column is still parsed and compared to ours afterwards for diagnostics (the printed "Mean absolute error" log is the misleading-but-expected metric; see §16).

The script:
1. Parses every row of the active sheet, takes `Date` + `Weight (kg)`.
2. Normalizes the date to UTC midnight using local Y/M/D extraction.
3. `prisma.user.upsert` with `id = "seed-user"`, username `admin`, password from `SEED_PASSCODE` env (default `1234`).
4. Upserts each `WeightEntry` keyed on `(userId, date)`.

### From the bundled fixture (used by tests)

`scripts/macrofactor-logged.json` ships in the repo. It contains 443 logged entries plus expected KPI values. `prisma/seed-test.ts macrofactor` loads it into the local SQLite DB for Playwright.

If you re-export from MacroFactor, regenerate the fixture:

```powershell
python scripts\analyze_mf.py "C:\path\to\new-export.xlsx"
# this overwrites scripts/macrofactor-logged.json
```

---

## 13. Vercel deployment

### Project wiring

- GitHub repo: `https://github.com/aristotaly/revers-mf`
- Vercel project: `aristotalys-projects/revers-mf`
- Branch: `main` (every push triggers a Production deploy)
- Build command (from `vercel.json`):

  ```
  prisma generate --schema=prisma/schema.prisma && prisma migrate deploy --schema=prisma/schema.prisma && next build
  ```

- Aliases:
  - `https://revers-mf.vercel.app` (canonical)
  - `https://revers-mf-git-main-aristotalys-projects.vercel.app`
  - `https://revers-mf-aristotalys-projects.vercel.app`

### Environment variables in Vercel

| Variable | Purpose |
|----------|---------|
| `POSTGRES_PRISMA_URL` | Pooled URL for runtime Prisma queries |
| `POSTGRES_URL_NON_POOLING` | Direct URL for migrations |
| `POSTGRES_URL`, `PG*` | Provided by Neon integration |
| `SESSION_SECRET` | HMAC key for session cookie. **Set this.** |
| `SEED_PASSCODE`, `SEED_USERNAME`, `SEED_USER_NAME` | Optional, consumed by seed scripts |

The Neon integration provisions the DB and most of the env vars automatically.

### Deploying a change

1. Make changes locally + run Playwright (`npx playwright test`) to confirm 6/6 green.
2. `git commit && git push origin main`.
3. Vercel auto-deploys. Watch with `npx vercel ls revers-mf`.
4. Once it shows `● Ready`, run the production smoke:
   ```powershell
   $env:PLAYWRIGHT_BASE_URL = "https://revers-mf.vercel.app"
   $env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
   $env:PROD_USERNAME = "admin"
   $env:PROD_PASSCODE = "Amdocs101"
   npx playwright test tests/production-smoke.spec.ts
   ```

### TLS certificate workaround

The deploying machine sits behind a corporate proxy with a self-signed cert. All Vercel and Neon CLI invocations need `NODE_TLS_REJECT_UNAUTHORIZED=0` set in the shell. **Don't bake this into committed code or CI** — it's a per-machine workaround.

---

## 14. Operations playbook

### "I need to change the admin password"

```powershell
# Load Postgres env (see §11)
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
$env:PROD_USERNAME = "admin"
$env:PROD_PASSWORD = "the-new-password"
npx tsx scripts/setup-prod-user.ts
```

No redeploy needed — credentials live in the DB.

### "I need to import a fresh MacroFactor export"

```powershell
# Load Postgres env (see §11)
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
npx tsx scripts/import-macrofactor.ts "C:\Users\<you>\Downloads\MacroFactor-XXXX.xlsx" --reset
```

The `--reset` flag is destructive but scoped to one user's entries.

### "Tests are failing because the Prisma client is wrong"

You probably ran `npm run db:generate:prod` last and are now trying to run local tests. Fix:

```powershell
# Clear Postgres env
Remove-Item env:DATABASE_URL,env:POSTGRES_PRISMA_URL,env:POSTGRES_URL_NON_POOLING,env:POSTGRES_URL -ErrorAction SilentlyContinue
npm run db:generate:local
npm run db:push:local
```

### "Vercel deploy is stuck with `column ... already exists`"

You applied SQL manually (likely via `setup-prod-user.ts` or a manual `ADD COLUMN`). Mark the migration as resolved:

```powershell
# Load Postgres env
npx prisma migrate resolve --schema=prisma/schema.prisma --applied <migration_folder>
git commit --allow-empty -m "Trigger Vercel rebuild after migration resolve"
git push origin main
```

### "The dev server won't start with `EPERM rename` on `.next/dev/...`"

Another `next dev` is still holding files open. Kill it:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item .next -Recurse -Force
```

### "I deleted the local SQLite DB and Prisma refuses to recreate it"

It moved to `prisma/prisma/dev.db` (Prisma resolves the relative URL relative to the schema directory in some configurations). Delete that one too:

```powershell
Remove-Item prisma/prisma/dev.db -ErrorAction SilentlyContinue
npm run db:push:local
```

---

## 15. Extending the app

### Adding a new screen

1. Create `app/<name>/page.tsx`. Read the session at the top and `redirect("/login")` if missing.
2. If you need interactive bits, split a client wrapper into `components/<name>/`.
3. Wire any mutation via a new Server Action in `lib/actions/<name>.ts` and call `revalidatePath` for any pages whose data should refresh.
4. Add nav links from `weight-trend-shell.tsx` or wherever appropriate.
5. Add a Playwright test (`tests/<name>.spec.ts`) covering at least one happy-path interaction.

### Adding a new KPI window (e.g. "2W" or "YTD")

1. Add the label to the `TimeWindow` union in `utils/analytics.ts`.
2. Add the day count to `daysMap` in `sliceByWindow`.
3. Add the button to `WINDOWS` in `components/weight-trend/period-filter.tsx`.
4. Add an expected value in `MF_TARGETS` in `tests/macrofactor-kpis.spec.ts` (run the Python script if you need to compute it).

### Adding multi-user support

This will be a real change. Touch points:

- `loginAction` already finds-by-username — good.
- A registration server action that runs `bcrypt.hash` and `prisma.user.create`. Validate uniqueness.
- A user-management screen (admin-only, gated in `middleware.ts`).
- All Server Actions already scope by `getSessionUserId()`, so data isolation is already correct.
- Seed scripts assume a single `id="seed-user"` row — generalize before deploying.

### Adding background processing (analytics, reminders, etc.)

Vercel Cron is the natural fit. Add a route under `app/api/cron/<name>/route.ts` and a `crons` entry to `vercel.json`. Authenticate with a secret header. **Never** put long-running work inside a Server Action.

---

## 16. Known quirks and gotchas

### The "All" view shows `-29.9` vs MacroFactor's `-30.0`

We are 0.1 kg off because **MacroFactor seeds its trend with prior history that we don't have**. MF's exported trend on day 0 (2024-10-31) is `125.45`; our seed is the first scale weight (`125.4`). For every other window (1W…1Y) the EWMA has long since converged, so the seed doesn't matter — only "All" sees it.

If you need exact parity here, you'd need to either:
- Import MF's day-0 trend as a synthetic pre-history scale entry, **or**
- Add a configurable `initialTrend` to `buildDailySeries` and seed it from MF's first export row.

Tests assert `-29.9` (our actual value), with a comment explaining the divergence.

### The import script prints a scary "Mean absolute error: 3.888 kg"

It's a **bug in the diagnostic, not the import**. The script's `compareTrends` function compares our day-by-day computed trend against MF's `Trend Weight` column read as if it were row-aligned to the (sparse) `Date` column. After the first logging gap that's apples-to-oranges. The import itself is correct.

If you want the right comparison number, run `python scripts/analyze_mf.py` instead. It treats MF's trend column as the continuous daily series it actually is and reports `Mean abs error: 0.0032 kg`.

### `package.json#prisma` deprecation warning

Every Prisma command logs a warning that the `"prisma"` key in `package.json` is deprecated. We're still on Prisma 6; the warning is for Prisma 7. When migrating to 7, move the `seed` field to `prisma.config.ts`.

### Recharts "width(-1) and height(-1)" console noise

Recharts logs this during SSR before it has a measured container. It's harmless and is filtered out of Playwright's strict console-error check.

### "I changed `EWMA_ALPHA` and now Playwright is angry"

Yes — that's the whole point of the macrofactor-kpis test. Don't change α=0.1 without rerunning `python scripts/analyze_mf.py` and confirming the new α still matches MF's trend within a fraction of a kilogram.

### Single-user assumption in seed scripts

Every seeding helper upserts a hardcoded `id = "seed-user"`. That's fine for a single-tenant app, but if you ever add real multi-user support, replace this with `createMany` and randomize the IDs.

---

## 17. Conventions for AI assistants

If you're an AI editing this repo, please honor these rules:

1. **Read `AGENTS.md` first.** This Next.js may differ from your training data; consult `node_modules/next/dist/docs/` for any routing API you're not 100% sure about.
2. **Edit existing files in preference to creating new ones.** Especially: never create more `*.md` docs unless explicitly asked. Extend this file instead.
3. **Never commit `.env`, `.env.local`, `.env.production`, or anything in `.vercel/`.** `.gitignore` already excludes them.
4. **Never run destructive Prisma commands** (`db push --force-reset`, `migrate reset`) without explicit user consent.
5. **Always update both Prisma schemas in lockstep.** Postgres and SQLite must match.
6. **Always update Playwright tests** when you change auth flows, KPI math, or any UI surface they assert.
7. **Don't widen test tolerances** to make failing tests pass. Track down why the value moved.
8. **The 565-day MacroFactor fixture is the source of truth** for KPI correctness. If you change `computeKpis`, the values in `MF_TARGETS` need a justified update with a comment.
9. **Use the existing tools.** `Math.round(x * 10) / 10` for 1-decimal rounding; `normalizeDate` for date hygiene; `EWMA_ALPHA` instead of a magic 0.1.
10. **When in doubt about MF parity**, run `python scripts/analyze_mf.py` and compare the table it prints against the test targets. That's the single ground-truth oracle.

---

## 18. Progressive Web App (PWA)

The app is installable on iOS, Android, and desktop Chromium browsers. There is **no third-party PWA library** in the dependency tree — everything is hand-rolled on Next.js's built-in conventions plus a small custom service worker.

### Files involved

| File | Purpose |
|------|---------|
| `app/manifest.ts` | Generates `/manifest.webmanifest` at build/request time. Sets name, icons, theme color, `display: standalone`, `start_url: /weight-trend`, and two app shortcuts (Log weight, Weight trend). |
| `public/sw.js` | The service worker. Precaches the offline shell + icons, cache-firsts `/_next/static/*`, network-firsts navigations with an offline fallback. |
| `public/offline.html` | Static page shown when a navigation fails offline. Self-contained inline CSS, no JS, no Next.js. |
| `public/icon-192.png`, `icon-512.png`, `icon-maskable.png`, `apple-icon.png`, `favicon.png` | Generated icon set. **Do not edit by hand** — re-run `npm run icons:generate`. |
| `scripts/generate-pwa-icons.mjs` | Renders the icon SVG → PNG with `sharp`. Edit the SVG markup here and re-run the script to change branding. |
| `components/pwa-register.tsx` | Client component, rendered once in the root layout. Registers `/sw.js` in production only. |
| `components/install-prompt.tsx` | Client banner shown on the dashboard. Captures `beforeinstallprompt` on Chromium, shows iOS Add-to-Home-Screen hint otherwise. Hides itself when running standalone or after dismissal (persisted in `localStorage`). |
| `app/layout.tsx` | Wires `metadata.manifest`, `metadata.icons.apple`, `metadata.appleWebApp`, and `viewport.themeColor`. Mounts `<PwaRegister />`. |
| `next.config.ts` | Adds cache-control + content-type headers for `/sw.js`, `/manifest.webmanifest`, `/offline.html`, and the icon PNGs. |
| `middleware.ts` | Whitelists `/manifest.webmanifest`, `/sw.js`, `/offline.html`, and `*.webmanifest|*.html` so the auth gate doesn't redirect them to `/login`. |
| `tests/pwa.spec.ts` | Verifies the manifest shape, SW headers, offline shell, icon URLs, and that the root layout advertises the right `<link>`s. |

### Caching strategy

The service worker is deliberately conservative because the app is auth-gated and renders user-specific HTML:

1. **Precache** (during `install`): `/offline.html`, `/manifest.webmanifest`, all icon PNGs.
2. **Cache-first** for `/_next/static/*` (hashed, immutable build artifacts).
3. **Network-first** for navigations. If `fetch` rejects (offline), respond with `/offline.html`.
4. **Pass-through** everything else: Server Actions, `/_next/data/*`, `/_next/image`, RSC payloads. These must always go to the network.

> **Never** add HTML responses to the runtime cache — they contain per-user data, and you'd accidentally serve admin's dashboard to a logged-out browser tab.

### Versioning the cache

The cache keys embed a `VERSION` constant at the top of `public/sw.js`. Bump it (`v1` → `v2` etc.) whenever you change the precache list or the SW logic — old clients will purge stale caches on `activate`.

If you change a precached asset (e.g. swap an icon) you don't strictly need to bump the version, because the precache step uses `cache.addAll(PRECACHE_URLS)` which fetches fresh copies during install. But bumping is the safe, no-brain option.

### Regenerating icons

```powershell
# Edit the SVG markup in scripts/generate-pwa-icons.mjs, then:
npm run icons:generate
```

This rewrites all five PNGs in `public/`. Commit the regenerated files. The script uses [`sharp`](https://sharp.pixelplumbing.com/) (pinned as a devDependency).

If you want to tweak the brand color, change `BRAND` and `BRAND_DARK` in the script and also update:
- `theme_color` in `app/manifest.ts`
- `viewport.themeColor` in `app/layout.tsx`
- The hex literals in `public/offline.html`

### What makes the app installable

Chromium's install promptability checks (the bar for the address-bar install icon to appear and `beforeinstallprompt` to fire):

- ✅ Served over HTTPS (Vercel handles this)
- ✅ `manifest.webmanifest` with `name`, `short_name`, `start_url`, `display: standalone`, and at least one 192×192 PNG icon
- ✅ Registered service worker with a `fetch` handler
- ✅ `theme_color` for the title bar

Safari/iOS doesn't use `beforeinstallprompt`; the user must tap Share → Add to Home Screen. The `InstallPrompt` component shows a one-time hint on iOS to teach them.

### Testing the PWA

```powershell
# Local: 5-test PWA suite (runs as part of the full suite too)
npx playwright test tests/pwa.spec.ts --reporter=list
```

To manually verify install on the live site:

1. Open [https://revers-mf.vercel.app](https://revers-mf.vercel.app) in Chrome.
2. Open DevTools → **Application** → **Manifest**. Confirm: name, theme color, icons all render, "Identity" is green.
3. **Application** → **Service Workers**. Confirm `sw.js` is "activated and running".
4. Address-bar install icon should appear. Click it.

### Local dev caveats

- `PwaRegister` is a no-op in development (`process.env.NODE_ENV !== "production"`). This keeps the SW out of your way while iterating — no surprise stale caches.
- If you want to test the SW locally, run `npm run build && npm run start` instead of `npm run dev`.
- iOS Safari only registers a service worker over HTTPS or `http://localhost`. Vercel preview URLs are HTTPS so this is automatic.

### Known limitations

- **No push notifications.** The Next.js PWA guide includes a VAPID/web-push setup; we deliberately skipped it because there's nothing to notify about. If you ever add reminders ("you haven't logged in 3 days"), the recipe in `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` is the starting point.
- **No background sync.** Entries created while offline are not queued — the upsert Server Action will simply fail. If you need write-while-offline, store pending entries in IndexedDB and replay them on the next online tick using the Background Sync API.
- **No app store distribution.** The PWA is install-only-from-browser. Wrapping it in Trusted Web Activity (Android Play Store) or PWABuilder is a future option.

---

## 19. Multi-user accounts and admin console

Added in May 2026. The app started life as a single-user passcode gate; the
multi-user upgrade turns it into a small admin-managed app where each user
keeps their own private weight history and the admin console at `/admin`
manages the directory.

### 19.1 Data model

The `User` table grew one column:

`role  String  @default(""user"")`

Allowed values (currently): `""admin""` and `""user""`. The type is
`String` rather than a Prisma enum to keep migrations cheap on Postgres,
but the TypeScript layer narrows it via the `CurrentUser.role` union in
`lib/session.ts`.

Every `WeightEntry` row already has a `userId` foreign key (the model
hasn''t changed in shape since v1 � it was always per-user, but the seed
script only created one user). Cascade-delete on `User` removes their
entries automatically, which is what powers the `Delete user` button.

### 19.2 Session + authorization

`lib/session.ts` exposes three layered helpers:

- `getSessionUserId()` � reads the signed cookie, no DB access.
- `getCurrentUser()` � looks up the user (id + role + name) on every call.
  Returns `null` if the cookie references a deleted user.
- `requireUser()` / `requireAdmin()` � throw if the request is anonymous
  or non-admin. Used by every server action in `lib/actions/admin.ts`.

Role is **always re-read from the DB**, never trusted from the cookie. This
means promoting/demoting/deleting a user takes effect on their next request
without any logout dance on the admin''s side.

### 19.3 Pages and components

| Path | What it is |
|------|------------|
| `app/admin/page.tsx` | Server component. Calls `getCurrentUser` + redirects non-admins to `/weight-trend`. Fetches users via `listUsersAction` and renders the shell. |
| `components/admin/admin-shell.tsx` | Client wrapper. Holds the `createOpen` state and toggles the `CreateUserDialog`. |
| `components/admin/user-list.tsx` | The directory. One row per user with three icon buttons: reset password, toggle role, delete. Calls `setUserPasswordAction` / `setUserRoleAction` / `deleteUserAction` via `useTransition` and surfaces results through `sonner` toasts. |
| `components/admin/create-user-dialog.tsx` | The simplified modal. **Only three fields**: display name, username, password. The server action always writes `role=""user""` � admins can promote later from the user list. |

The dashboard (`components/weight-trend/weight-trend-shell.tsx`) takes an
optional `currentUser` prop. When the user has the admin role, a
`Manage users` link appears in the footer nav; everyone sees a
`Sign out` link.

### 19.4 Server actions

All in `lib/actions/admin.ts`:

- `listUsersAction()` � read-only, returns `AdminUserSummary[]` (id,
  username, name, role, entry count, createdAt).
- `createUserAction(formData)` � zod-validates `username` / `name` /
  `password`. Always writes `role=""user""` (the modal has no role
  field; this is intentional).
- `deleteUserAction(userId)` � refuses to delete yourself or the last
  admin.
- `setUserRoleAction(userId, role)` � refuses to demote yourself or the
  last admin.
- `setUserPasswordAction(userId, newPassword)` � bcrypt-hashes and
  updates.

All actions call `revalidatePath(""/admin"")` on success and return
`{ ok: boolean; error?: string }`.

### 19.5 Toast notifications

The root `app/layout.tsx` mounts `<Toaster richColors position=""top-center"" />`
from [`sonner`](https://sonner.emilkowal.ski/). Every admin action surfaces
a toast (`toast.success` on the green path, `toast.error` on the red).
The Playwright spec `tests/admin.spec.ts` asserts on the success toast
text � e.g. `User ""alice"" created`.

### 19.6 Adding the role column to an existing database

Two paths depending on environment:

- **Local SQLite** � `npm run db:push:local` regenerates the schema in
  place (delete `prisma/dev.db` first if Prisma complains about an
  existing `role IS NULL` violation).
- **Vercel Postgres** � the migration at
  `prisma/migrations/20260519100000_add_user_role/migration.sql` is
  idempotent:
  - `ADD COLUMN IF NOT EXISTS ""role""`
  - backfills `""admin""` for the username `""admin""`
  - backfills `""user""` for everyone else
  - sets `DEFAULT ''user''` and `NOT NULL`

  `scripts/setup-prod-user.ts` runs the same SQL via
  `` and is safe to re-run.

### 19.7 Tests (`tests/admin.spec.ts`)

Six scenarios that exercise the full admin lifecycle:

1. `admin sees Manage users link; non-admin does not` � RBAC contract.
2. `create user via simplified modal + toast notification` � happy path
   covering the modal + toast assertion.
3. `admin can reset another user''s password` � verifies old password
   rejected and new one accepted.
4. `admin can promote a user to admin and back` � toggles role twice,
   reads toast for both states.
5. `admin cannot delete or demote themselves` � UI safety (buttons
   disabled).
6. `admin can delete a non-admin user` � and the row disappears.

Run them in isolation with:

\\\powershell
\ = ""file:./prisma/dev.db""
npx playwright test tests/admin.spec.ts --reporter=list
\\\

### 19.8 Common operational tasks

- **Add a new user** ? log in as admin ? `Manage users` ? `Add user`
  (icon top-right) ? fill in name / username / password ? Create.
- **Reset someone''s password** ? key icon on their row ? enter new password.
- **Promote a regular user to admin** ? shield icon on their row ? confirm.
- **Delete a user (incl. their weight history)** ? trash icon ? confirm.
- **Forgotten admin password (local)** ? `npm run db:seed` re-stamps
  `admin` with `SEED_PASSCODE` (defaults to `1234`).
- **Forgotten admin password (prod)** ? `npx tsx scripts/setup-prod-user.ts`
  with `POSTGRES_PRISMA_URL` set; resets to `Amdocs101` by default.

### 19.9 Why the modal is 3 fields, not 4

Earlier prototypes had a role selector in the modal. We dropped it because:

- The common case is creating a regular user. Adding an extra admin is rare
  and there''s already a one-click promote in the user list.
- Forcing role choice every time made the modal feel heavier without
  earning anything.
- It removes one possible misclick path (accidentally creating an admin).

If you ever need to bulk-create admins, prefer the user-list promote button
over reintroducing the field. Or call `setUserRoleAction` from a one-off
`tsx` script.
