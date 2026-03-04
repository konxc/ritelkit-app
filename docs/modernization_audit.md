# Analisa Mendalam Modernisasi Arsitektur: Roti Sholawat Admin (V2 - Definitif)

Dokumen ini adalah hasil audit teknis 100% komprehensif terhadap codebase untuk transisi ke arsitektur modern per 2026.

## 1. Status Migrasi: Ringkasan Eksekutif

| Fase  | Area                                          | Status            | Fokus Utama                                                           |
| :---- | :-------------------------------------------- | :---------------- | :-------------------------------------------------------------------- |
| **A** | **Katalog (Categories, Inventory)**           | **Selesai [X]**   | Astro Actions + Svelte 5 Runes + SSR.                                 |
| **B** | **Operasional (Orders, Invoices, Shipments)** | **Dalam Proses**  | Kompleksitas tinggi, integrasi Midtrans.                              |
| **C** | **Admin & Pemasaran (Ads, Users, CMS)**       | **Menunggu [ ]**  | Utilitas pendukung dan logging audit.                                 |
| **D** | **Infrastruktur Hybrid**                      | **Strategis [X]** | Pemeliharaan arsitektur tRPC + TanStack Query untuk kompleksitas CSR. |

---

## 2. Pemetaan Backend: Arsitektur Hybrid (Astro Actions + tRPC)

Strategi baru kita adalah mempertahankan keseimbangan (Hybrid SSR/CSR):

- **Astro Actions / Drizzle SSR**: Digunakan untuk halaman publik, rendering awal, dan aksi mutasi simpel.
- **tRPC + TanStack Query**: Tetap dipertahankan untuk komponen admin yang interaktif, _Data Grid_ yang sangat kompleks, dan logika _dashboard_ yang butuh _caching/auto-refetch_ secara efisien.

### A. Modul Pesanan & Transaksi (Fase B)

| Router       | Method tRPC | Target Action / Logic                     | Kompleksitas                |
| :----------- | :---------- | :---------------------------------------- | :-------------------------- |
| **orders**   | `list`      | Direct Drizzle SSR di `orders.astro`.     | Tinggi (Search/Filter/Join) |
| **orders**   | `get`       | Direct Drizzle SSR di `[order_no].astro`. | Menengah (Parsing JSON)     |
| **orders**   | `update`    | `actions.updateOrder`                     | Menengah (Audit Log)        |
| **invoices** | `list`      | Direct Drizzle SSR di `invoices.astro`.   | Menengah (Join Orders)      |
| **invoices** | `create`    | `actions.createInvoice`                   | Menengah (INV Number Gen)   |
| **invoices** | `update`    | `actions.updateInvoice`                   | Rendah                      |

### B. Modul Logistik & Pengembalian (Fase B)

| Router        | Method tRPC | Target Action / Logic                   | Kompleksitas             |
| :------------ | :---------- | :-------------------------------------- | :----------------------- |
| **shipments** | `list`      | Direct Drizzle SSR di `shipping.astro`. | Rendah                   |
| **shipments** | `create`    | `actions.createShipment`                | Menengah (Status Sync)   |
| **shipments** | `update`    | `actions.updateShipment`                | Menengah                 |
| **refunds**   | `list`      | Direct Drizzle SSR di `refunds.astro`.  | Rendah                   |
| **refunds**   | `create`    | `actions.createRefund`                  | Menengah (Provider Sync) |

### C. Modul Admin & Konfigurasi (Fase C)

| Router         | Method tRPC     | Target Action / Logic                | Kompleksitas           |
| :------------- | :-------------- | :----------------------------------- | :--------------------- |
| **adminUsers** | `list`          | Direct Drizzle SSR di `users.astro`. | Rendah                 |
| **adminUsers** | `create/update` | `actions.upsertAdminUser`            | Menengah (BCrypt/Hash) |
| **settings**   | `get/update`    | `actions.updateSettings`             | Menengah (JSON Blob)   |
| **audit**      | `list`          | Direct Drizzle SSR di `audit.astro`. | Menengah (Big Data)    |

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

## 5. Roadmap Prioritas (Update Hybrid)

1.  **Fase B1 (Pesanan)**: Migrasi sebagian ke Runes, pertahankan tRPC untuk grid data yang berat.
2.  **Fase B2 (Invoice & Logistik)**: Manfaatkan stabilitas tRPC untuk perhitungan Midtrans dan shipping.
3.  **Fase C (Sistem)**: Modernisasi visual dengan UI tersinkronisasi.
4.  **Fase D (Hybrid Architecture)**: Stabilisasi infrastruktur hibrida. File `src/server/routers` dipertahankan dan ditata lebih bersih.

---

> [!NOTE]
> Audit ini bersifat hidup. Jika ditemukan kueri SQL yang tidak efisien atau kueri N+1 pada saat migrasi, segera dokumentasikan di bagian Roadmap.
