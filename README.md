# Roti Sholawat - Official Website

Modern, premium landing page for **Roti Sholawat**, a bakery located in Bantul, Yogyakarta. Built with Astro 5 and Svelte 5.

## 🚀 Project Overview

Roti Sholawat is a traditional bakery with premium quality, operating since 2016. This project aims to digitize their presence and provide a platform for order management and business growth.

## Project Structure

```text
/
├── docs/               # Business roadmap, sprint plans, and strategy documents
├── public/             # Static assets (images, favicon, etc.)
├── src/
│   ├── layouts/        # Base HTML structures
│   ├── pages/          # Astro routes
│   └── styles/         # Global design tokens and CSS
├── bahan/              # Raw data and research materials
├── package.json
└── astro.config.mjs
```

## Documentation

Detailed business and execution documents can be found in the `docs/` folder:

- [Briefing Roadmap](./docs/Briefing%20Roadmap.md)
- [Execution Sprint Plan](./docs/Breakdown%20Task%20Mingguan%20-%20Execution%20Sprint%20Plan.md)
- [Strategic Business Brief](./docs/Strategic%20Business%20Brief:%20Penguatan%20Sistem%20&%20Model%20Bisnis%20Roti%20Sholawat.md)

## Commands

All commands are run from the root of the project:

| Command              | Action                                             |
| :------------------- | :------------------------------------------------- |
| `bun install`        | Installs dependencies                              |
| `bun run dev`        | Starts local dev server at `localhost:4321`        |
| `bun run build`      | Build your production site to `./dist/`            |
| `bun run preview`    | Preview your build locally                         |
| `pnpm run smoke:api` | Smoke-check endpoint kritikal (butuh server aktif) |

## Tech Stack

- **Framework**: [Astro 5](https://astro.build)
- **UI Framework**: [Svelte 5](https://svelte.dev)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com)
- **Runtime**: [Bun](https://bun.sh)

## Environment Setup

Copy `.env.example` into one of:

1. `.env.local` for local development
2. `.env.development` for shared dev
3. `.env.production` for production deploy

Required variables:

- `PUBLIC_SITE_URL`
- `PUBLIC_WHATSAPP_NUMBER`
- `PUBLIC_MIDTRANS_CLIENT_KEY`
- `MIDTRANS_SERVER_KEY`
- `PUBLIC_MIDTRANS_MERCHANT_ID`
- `MIDTRANS_IS_PRODUCTION`
- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN` (Turso only)
- `ADMIN_SESSION_SECRET`
- `SETUP_TOKEN`

## Admin Setup

1. Set `SETUP_TOKEN` in your env file.
2. Open `/admin/setup` and create the first admin.
3. Login at `/admin/login`.

## Build Targets

- Cloudflare Pages (default):
  - `pnpm run build` or `pnpm run build:cloudflare`
- Node/Bun container:
  - `ASTRO_ADAPTER=node pnpm run build:node`
  - Set `DOCKER=1` or `NODE_RUNTIME=1` to force node adapter.

## Health Check

- Basic: `GET /api/health`
- Deep checks (DB + R2): `GET /api/health?deep=1`
- External checks (DB + R2 + Midtrans): `GET /api/health?deep=2`
- Auth check (admin session): `GET /api/health?auth=1`
- DB write test: `GET /api/health?deep=1&write=1`
- Checkout dry-run: `POST /api/health/checkout`
- Storage test (R2/local): `POST /api/health/storage`

## Docker

Build and run (Node adapter):

1. `docker build -t roti-sholawat .`
2. `docker run -p 4321:4321 --env-file .env.production roti-sholawat`

Or using compose:

1. `docker compose up --build`

Compose profiles:

- `roti-sholawat` (local sqlite)
- `roti-sholawat-turso` (Turso + R2)

Docker env template:

- `.env.docker` for local compose

Dev override (hot reload):

- `docker compose -f docker-compose.yml -f docker-compose.override.yml up --build`
