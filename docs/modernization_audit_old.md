# Analisa Mendalam Modernisasi Arsitektur: Roti Sholawat Admin (V2 - Definitif)

Dokumen ini adalah hasil audit teknis 100% komprehensif terhadap codebase untuk transisi ke arsitektur modern per 2026.

## 1. Status Migrasi: Ringkasan Eksekutif

| Fase | Area | Status | Fokus Utama |
| :--- | :--- | :--- | :--- |
| **A** | **Katalog (Categories, Inventory)** | **Selesai [X]** | Astro Actions + Svelte 5 Runes + SSR. |
| **B** | **Operasional (Orders, Invoices, Shipments)** | **Menunggu [ ]** | Kompleksitas tinggi, integrasi Midtrans. |
| **C** | **Admin & Pemasaran (Ads, Users, CMS)** | **Menunggu [ ]** | Utilitas pendukung dan logging audit. |
| **D** | **Infrastruktur & Cleanup** | **Menunggu [ ]** | Penghapusan total tRPC & TanStack Query. |

---

## 2. Pemetaan Backend: tRPC ke Astro Actions (Database Layer)

Setiap kueri tRPC akan digantikan oleh **Direct Drizzle Query** (untuk SSR) dan setiap mutasi akan menjadi **Astro Action**.

### A. Modul Pesanan & Transaksi (Fase B)
| Router | Method tRPC | Target Action / Logic | Kompleksitas |
| :--- | :--- | :--- | :--- |
| **orders** | `list` | Direct Drizzle SSR di `orders.astro`. | Tinggi (Search/Filter/Join) |
| **orders** | `get` | Direct Drizzle SSR di `[order_no].astro`. | Menengah (Parsing JSON) |
| **orders** | `update` | `actions.updateOrder` | Menengah (Audit Log) |
| **invoices** | `list` | Direct Drizzle SSR di `invoices.astro`. | Menengah (Join Orders) |
| **invoices** | `create` | `actions.createInvoice` | Menengah (INV Number Gen) |
| **invoices** | `update` | `actions.updateInvoice` | Rendah |

### B. Modul Logistik & Pengembalian (Fase B)
| Router | Method tRPC | Target Action / Logic | Kompleksitas |
| :--- | :--- | :--- | :--- |
| **shipments** | `list` | Direct Drizzle SSR di `shipping.astro`. | Rendah |
| **shipments** | `create` | `actions.createShipment` | Menengah (Status Sync) |
| **shipments** | `update` | `actions.updateShipment` | Menengah |
| **refunds** | `list` | Direct Drizzle SSR di `refunds.astro`. | Rendah |
| **refunds** | `create` | `actions.createRefund` | Menengah (Provider Sync) |

### C. Modul Admin & Konfigurasi (Fase C)
| Router | Method tRPC | Target Action / Logic | Kompleksitas |
| :--- | :--- | :--- | :--- |
| **adminUsers** | `list` | Direct Drizzle SSR di `users.astro`. | Rendah |
| **adminUsers** | `create/update`| `actions.upsertAdminUser` | Menengah (BCrypt/Hash) |
| **settings** | `get/update` | `actions.updateSettings` | Menengah (JSON Blob) |
| **audit** | `list` | Direct Drizzle SSR di `audit.astro`. | Menengah (Big Data) |

---

## 3. Pemetaan Frontend: Svelte 5 Runes (UI/UX Layer)

Seluruh komponen di `src/components/admin/pages/` wajib bermigrasi dari TanStack Query ke Svelte 5 Runes.

### Checklist Refaktorisasi UI
- [x] **CategoriesManager.svelte**: Selesai (Runes + Actions).
- [x] **InventoryManager.svelte**: Selesai (Runes + Actions).
- [ ] **ProductsManager.svelte**: Selesai Dasar (Perlu final cleanup props).
- [ ] **OrdersManager.svelte**: Target berikut (Migrasi `ordersQuery` ke `$derived`).
- [ ] **OrderDetailManager.svelte**: Target berikut (Migrasi `updateMutation` ke Action).
- [ ] **InvoicesManager.svelte**: Perlu penghapusan `useQueryClient`.
- [ ] **AdminUsersManager.svelte**: Perlu penghapusan total TanStack.
- [ ] **CmsManager.svelte**: Perlu integrasi Svelte 5 `$state` untuk editor konten.

---

## 4. Standar Modernisasi (Infrastruktur)

### A. Data Fetching (SSR-First)
- **Aturan**: Jangan melakukan `fetch` di `onMount` jika data bisa diambil di server `.astro`.
- **Pola**: Lewati data dari Astro Page melalui prop `initialData` ke komponen Svelte.

### B. State Management
- Gunakan `$state` untuk data lokal (form input, UI toggles).
- Gunakan `$derived` untuk data hasil kueri atau filter yang reaktif terhadap props.
- Gunakan `$effect` (secara terbatas) untuk sinkronisasi dengan API luar atau logging.

### C. Keamanan & Validasi
- **Zod**: Gunakan `src/lib/types.ts` sebagai single source of truth untuk skema validasi.
- **CSRF**: Selalu sertakan `csrfToken` pada upload file atau aksi sensitif.
- **Audit**: Pastikan `logAudit` dipanggil pada setiap Action yang mengubah data (mencatat aktor, aksi, dan metadata JSON).

---

## 5. Roadmap Prioritas (Update)

1.  **Fase B1 (Pesanan)**: Migrasi `orders` router dan `OrdersManager`. Ini adalah jantung dari admin dashboard.
2.  **Fase B2 (Invoice & Logistik)**: Melengkapi alur pemenuhan pesanan.
3.  **Fase C (Sistem)**: Modernisasi manajemen user dan audit logs.
4.  **Fase D (Penghapusan Legacy)**: Menghapus folder `src/server/routers` dan menghapus `trpc` dari `package.json`.

---
> [!NOTE]
> Audit ini bersifat hidup. Jika ditemukan kueri SQL yang tidak efisien atau kueri N+1 pada saat migrasi, segera dokumentasikan di bagian Roadmap.
