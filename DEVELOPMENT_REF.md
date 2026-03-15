# 🚀 RitelKit Ecosystem: Master Development Guide

Welcome to the **RitelKit Ecosystem**. This document serves as the primary technical guide for developers working on the RitelKit platform and its associated tenant applications.

## 🏗️ Architecture Overview

The ecosystem consists of two main components:

1.  **RitelKit (Central Platform)**: `ritelkit/`
    *   The management dashboard.
    *   Handles global tenant management, billing, auditing, and high-level inventory.
    *   URL: `http://ritelkit.local:4322`
2.  **RitelKit App (Tenant Instance)**: `ritelkit-app/`
    *   The actual operational app used by each business (tenant).
    *   Multi-tenant architecture: One codebase, one database, isolated by `tenantId`.
    *   URL: `http://{tenant-slug}.ritelkit.local:4321`

---

## 🔒 Multi-Tenancy Design

RitelKit uses a **Domain-Based Multi-Tenancy** model using a shared database with row-level isolation.

### 1. Tenant Detection
The system identifies the tenant via the **Host Header** in the request.
*   **Logic**: `src/middleware.ts` extracts the subdomain (slug).
*   **Context**: The detected tenant object is stored in `Astro.locals.tenant`.

### 2. Data Isolation (The Gold Standard)
Every database operation MUST be scoped to the `tenantId`. 
*   **Inserts**: Always include `tenantId: apiCtx.locals.tenant.id`.
*   **Queries/Updates/Deletes**: Always filter using `and(eq(table.id, id), eq(table.tenantId, tenantId))`.
*   **Action Wrapper**: Use `defineAction` and verify the `admin` session and `tenant` context before proceeding.

---

## 🗄️ Database Strategy

We use **Turso (LibSQL)** for a blazing fast, edge-ready SQLite experience.

*   **ORM**: Drizzle ORM.
*   **Schema**: Located in `src/db/schema.ts`.
*   **Migrations**: 
    1. Update `schema.ts`.
    2. Run `pnpm run db:generate`.
    3. Run `pnpm run db:push` (for dev) or use the migration script for production.

---

## 🛠️ Local Development Setup

To replicate this environment on your machine:

### 1. Host File Configuration
Add the following to your `/etc/hosts` (macOS/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
```text
127.0.0.1  ritelkit.local
127.0.0.1  kopi-toktok.ritelkit.local
127.0.0.1  toko-baru.ritelkit.local
```

### 2. Environment Variables (`.env.local`)
Copy `.env.example` to `.env.local` in both directories.
*   Use `local.db` for SQLite.
*   Set `LOCAL_DOMAIN=ritelkit.local`.

### 3. Running the Apps
Open two terminals:
*   **Terminal A (Central)**: `cd ritelkit && pnpm dev --port 4322`
*   **Terminal B (Tenant)**: `cd ritelkit-app && pnpm dev --port 4321`

---

## 📝 Coding Standards & Best Practices

1.  **Component Reactivity**: Use Svelte 5 runes (`$state`, `$derived`, `$effect`) correctly. Avoid `$derived` on props directly unless necessary.
2.  **TRPC vs Actions**: 
    *   Use **Astro Actions** for mutations (POST/PUT/DELETE).
    *   Use **TRPC** for complex data fetching and real-time state synchronization.
3.  **Audit Logs**: Every mutation action should end with a call to `logAudit()`.
4.  **UI/UX**: Follow the premium aesthetics established in the project. Use `Card`, `Button`, and `Badge` components from the common library.

---

## 📡 Production Config (Turso)

| Project | Turso URL |
| :--- | :--- |
| **RitelKit App** | `libsql://retailkit-app-konxc.aws-ap-northeast-1.turso.io` |
| **RitelKit Central** | `libsql://retailkit-konxc.aws-ap-northeast-1.turso.io` |

*(Tokens are stored in the `.env.production` files created in each root)*

---

### 🆘 Troubleshooting
*   **404 on Tenant Link?** Check if the Host header is passed correctly (e.g., using `ritelkit.local`).
*   **Database Locked?** Ensure no other process is holding a write lock on `local.db`.
*   **Typescript Errors?** Run `pnpm run build` to regenerate types from the database schema.
