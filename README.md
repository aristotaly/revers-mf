# revers-mf — Weight Trend Tracker

A mobile-first weight tracking web app with EWMA trend analytics, built with Next.js, Prisma, and Tailwind CSS.

## Features

- **Scale Weight** — log daily weight entries (kg)
- **Weight Trend** — EWMA-smoothed trend line with interpolation for missing days
- **Dashboard** — KPIs, Recharts chart, period filters, daily breakdown table
- **Passcode auth** — lightweight single-user gate

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + Radix UI primitives
- Prisma ORM (SQLite local / PostgreSQL on Vercel)
- Recharts + Playwright

## Prerequisites

Use [NVS](https://github.com/jasongin/nvs) for Node.js:

```powershell
$env:NVS_HOME = "$env:LOCALAPPDATA\nvs"
. "$env:NVS_HOME\nvs.ps1"
nvs add lts
nvs use lts
```

## Local development

```bash
npm install
cp .env.example .env

npm run db:generate:local
npm run db:push:local
npm run db:seed

npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default passcode: `1234`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (SQLite, regenerates Prisma client) |
| `npm run build` | Production build (Postgres Prisma client) |
| `npm run db:seed` | Seed user and ~30 days of sample weights |
| `npm run db:seed:test` | Reset DB with Playwright fixture data |
| `npm run test:e2e` | Playwright end-to-end tests |

## Vercel deployment

1. Create a Vercel Postgres database and attach to the project.
2. Set environment variables:
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `SESSION_SECRET`
   - `SEED_PASSCODE` (optional, for seeding)
3. Build command:

   ```
   prisma generate --schema=prisma/schema.prisma && prisma db push --schema=prisma/schema.prisma && next build
   ```

4. Run `npm run db:seed` once against production (or use Vercel CLI).

## Analytics

Trend values are computed in memory (`utils/analytics.ts`) using EWMA with α = 0.1. Missing days between entries are filled via linear interpolation. Only raw scale weights are stored in the database.

## License

Private — personal use.
