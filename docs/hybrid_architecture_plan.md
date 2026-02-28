# Hybrid Architecture Planner: Roti Sholawat (Astro SSR + Svelte 5 Runes + tRPC)

Dokumen ini merinci langkah-langkah presisi untuk menstabilkan kembali dan menyempurnakan pendekatan **Hybrid SSR/CSR**. Berdasarkan evaluasi, mengganti total *Data Grid* operasional (seperti Orders, Invoice) dari perlindungan `tRPC` + `TanStack Query` ke manipulasi *Runes* manual ternyata menghilangkan banyak fitur gratis (seperti *auto-refetch, pagination cache, optimistic updates*).

Oleh karena itu, strategi definitif kita untuk **Fase B & C** adalah mempertahankan infrastruktur tRPC yang kokoh, sambil meng-upgrade _client-side_ Svelte-nya untuk secara reaktif mengonsumsi tRPC dengan mulus melalui *Runes*.

---

## 1. Analisis Konteks Hybrid

### A. Pembagian Beban Kerja
- **Astro Actions / SSR**: Fokus menangani *Public/Storefront*, aksi pengiriman formulir sederhana (Login, Settings, Profile), dan pemuatan awal (*Hydration*) karena mengutamakan SEO lokal dan *Zero-JS load*.
- **tRPC + TanStack Query**: Mengatur aliran listrik utama untuk Admin UI (Tabel Pesanan, Daftar Pengguna, Inventory Analytics). Berperan reaktif menjemput data di belakang layar (CSR) tanpa perlu *Full-Page Reload*.

### B. Masalah Pasca-Restorasi
Pasca `git checkout`, file-file backend tRPC sudah kembali (`src/server/routers/*`, `QueryProvider.svelte`), namun:
1. Banyak komponen astro UI (seperti `pesanan.astro` atau `katalog.astro`) telah terlanjur "dibersihkan" dari `QueryProvider` pasca Fase A & B kemarin.
2. Komponen seperti `OrdersManager.svelte` atau `InventoryManager.svelte` sudah terlanjur diubah menggunakan Svelte 5 `$state` murni dan `Astro Actions`. 
3. *Svelte Query v5* sudah tersambung di package.json, tapi perlu dipastikan ia beroperasi mulus dengan *Svelte 5 Runes*.

---

## 2. Roadmap Restorasi & Penyempurnaan (Step-by-Step)

### FASE 1: Stabilisasi Infrastruktur Core (tRPC Layer)
*Fokus: Mengembalikan pondasi pipa data agar Astro dan Svelte bisa "berbicara" lagi dengan server tRPC.*

- [x] **1.1. Verifikasi `QueryProvider.svelte` & `queryClient.ts`**
  - Pastikan adapter `@tanstack/svelte-query` versi v5 menggunakan pola inisialisasi yang disarankan Svelte 5 (menghapus *legacy* Svelte 4 Store jika perlu).
- [x] **1.2. Re-Integrasi di Layout/Page Astro**
  - Pasang kembali `<QueryProvider client:load>` membungkus komponen Svelte utama di dalam `src/pages/admin/pesanan.astro`, `sistem.astro`, dll.
  - Atau, bungkus di reaktor pusat `AdminLayout.astro` jika memungkinkan, atau lempar melalui `SistemTabContent.svelte`.
- [x] **1.3. Validasi tRPC Server & Caller**
  - Pastikan `src/server/router.ts` merelasikan ulang seluruh modul (orders, inventory, dll).
  - Pastikan `trpc/[trpc].ts` (Astro endpoint) kembali berjalan normal (bisa dikirim request).

### FASE 2: Adaptasi Svelte 5 Runes x TanStack Query
*Fokus: Menulis _wrapper_ reaktif Svelte 5 atau memastikan `@tanstack/svelte-query` + `tRPC` menyerap data dari database dan dinikmati langsung lewat `$derived`.*

- [x] **2.1. Standarisasi Pola `trpc.query` pada Runes**
  Menciptakan konvensi Svelte 5 agar setiap `createQuery` hasil dari tRPC terekspos mulus ke `$derived.by()`.
- [x] **2.2. Restorasi Parsial `OrdersManager.svelte` (Kompleksitas Tinggi)**
  - Kembalikan ke penggunaan *tRPC createQuery(orders.list)*.
  - Kelola *loading state*, *pagination*, dan *filters* dengan `$state`, lalu masukkan nilainya ke _args_ tRPC.
- [x] **2.3. Restorasi `AdsManager.svelte` & `CouponsManager`**
  - Menghapus panggilan *Astro Actions* yang lambat dan rapuh untuk grid tabel, beralih penuh ke *tRPC mutations* yang langsung mengetrigger `queryClient.invalidateQueries()`.

### FASE 3: Sinkronisasi dan Cleanup
*Fokus: Menghapus "sampah" logika duplikat pasca transisi.*

- [x] **3.1. Penyesuaian `actions/index.ts`**
  - Singkirkan astro actions yang redundan dengan rute trpc (seperti `updateOrder` yang rumit, jika sudah ada `trpc.orders.update`).
  - Pertahankan tindakan login/logout di Action.
- [x] **3.2. Form Validation & UI/UX**
  - Cek kembali tombol Loading/Disable (optimistic disable). `isSubmitting` harus bersumber dari `$mutation.isPending` milik TanStack.
- [x] **3.3. Build & Lint Test**
  - Pastikan Type Inference E2E dari Drizzle DB => tRPC Router => Svelte Component terkunci dengan sempurna (tidak ada tilde merah).

---

## 3. Aturan Main *Development* Hibrida:
1. **Dilarang Menghapus Router:** File di dalam `src/server/routers/` adalah kunci. Jika ada perubahan schema DB, ubah di Drizzle dan update router.
2. **Prioritaskan tRPC untuk Tabel Admin:** Untuk komponen berakhiran `...Manager.svelte`, mutlak gunakan tRPC.
3. **Optimistic Updates Sederhana:** Gunakan `queryClient.invalidateQueries` di akhir *mutation onSuccess* untuk menyerahkan sinkronisasi otomatis ke QueryClient, ini jauh lebih bersih dari pada operasi array manipulasi `$state` manual.

> **Dokumen ini dirancang sebagai _Checklist_ yang bisa kita ikuti bersama. Mohon baca dan verifikasikan apakah alur pemikiran restorasi ini sudah sesuai dengan yang Anda ekspektasikan?**
