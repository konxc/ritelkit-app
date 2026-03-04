# Laporan Audit Arsitektur Final: Transisi Menuju Hybrid Absolut (2026)

**Tanggal Audit:** 28 Februari 2026
**Fokus:** Standardisasi Data Grid dan Mekanisme Fetching/Mutasi pada Komponen Admin Dasbor Roti Sholawat.

## 1. Latar Belakang Masalah

Pada awal proses refaktorisasi (Fase A hingga C), strategi awal kita adalah memigrasikan sebanyak mungkin operasi menuju **Astro Actions** murni dan membuang dependensi pihak ketiga seperti `tRPC` dan `@tanstack/svelte-query`. Tujuannya adalah untuk menyederhanakan kode dan merangkul ekosistem bawaan Astro 5+.

Namun, selama proses tersebut, kita menyadari batasan fundamental:

- Astro Actions sangat cocok dan efisien untuk interaksi form yang bersifat statis atau operasi yang berjalan sesekali (seperti login, pengaturan profil, pengisian form CMS).
- Namun untuk antarmuka **Data Grid interaktif** (Tabel yang memiliki fitur pencarian _real-time_, paginasi adaptif tanpa memuat ulang halaman, filter dinamis, dan operasi _Create/Update/Delete_ sejajar baris data), **Astro Actions seringkali membutuhkan _boilerplate_ ekstra** (seperti membuat _state fetching_ manual `isFetching`, menghandle _stale data_, dan _refecthing_ paksa).

Untuk itu, diputuskanlah bermanuver ke pola **Arsitektur Hybrid Absolut**:

1.  **Astro Actions**: Khusus difokuskan pada operasi server-side statis, pengaturan sistem, autentikasi, dan pengiriman _form submission_ (CMS, Setelan Pengiriman, Manajemen Akses, dsb).
2.  **tRPC + TanStack Query**: Dipulihkan secara terukur _khusus_ untuk menangani kerumitan state _Data Grid_ operasional (Tabel Pesanan, Daftar Pelanggan, Inventaris).

## 2. Pemetaan Komponen Saat Ini (Pasca Fase E)

Penyisiran mendalam telah memvalidasi letak implementasi arsitektur di seluruh modul administratif (`src/components/admin/pages/`).

### A. Modul 100% tRPC + TanStack Query (Hybrid - Data Grid Kompleks)

Komponen-komponen berikut telah diadaptasi untuk memanfaatkan `createQuery` dari TanStack dengan mutasi dari `trpc` guna memastikan performa _Client-Side Rendering_ (CSR) terbaik:

1.  ✅ `OrdersManager` (Pesanan / Kasir)
2.  ✅ `InvoicesManager` (Faktur)
3.  ✅ `CouponsManager` (Kupon Diskon)
4.  ✅ `AdsManager` (Kampanye Iklan)
5.  ✅ `CustomersManager` (CRM Pelanggan) _(Dirombak pada Fase E)_
6.  ✅ `FulfillmentManager` (Pengiriman Pesanan) _(Dirombak pada Fase E)_
7.  ✅ `ShippingManager` (Aturan Kurir) _(Dirombak pada Fase E)_
8.  ✅ `RefundsManager` (Pengembalian Dana) _(Dirombak pada Fase E)_
9.  ✅ `OrderDetailManager` (Detail Pesanan - tRPC untuk _get_/_update_ status interaktif)

### B. Modul 100% Astro Actions (Operasi Server / Form Statis)

Komponen-komponen ini berfungsi seperti aplikasi server-rendered murni yang hanya mengubah state ketika _event handler_ dikirim secara sekuensial. Ini merupakan penggunaan Astro Actions terbaik:

1.  ✅ `AdminUsersManager` (Manajemen Akun Admin)
2.  ✅ `InvoiceDetailManager` (Perubahan tenggat waktu faktur)
3.  ✅ `SettingsManager` (Setelan Pengiriman Global, Preorder, Lead Time)
4.  ✅ `NotificationsManager` (Pengiriman _Push Notification_ & Email massal)
5.  ✅ `AuditLogManager` (Log aktivitas satu arah, non-mutasi)
6.  ✅ `CmsManager` (Update konten SEO & _Header_ promosi HTML)

## 3. Temuan Kritis & Rekomendasi Pungkas (Fase F)

Pada fase-fase paling perdana pengembangan arsitektur modern kita (Fase A), 3 fitur katalog bisnis sempat dimodifikasi untuk menggunakan rekayasa Astro Actions sebelum kita merumuskan kesimpulan "Hybrid" di atas. Walau saat ini ketiganya bebas dari _bugs_ dan berjalan normal, arsitekturnya kini **"inconsistent"** (tidak konsisten) bila dikomparasi dengan komponen Data Grid sekelasnya:

1.  📦 **`ProductsManager.svelte`**
2.  🗂️ **`CategoriesManager.svelte`**
3.  📉 **`InventoryManager.svelte`**

Ketiga modul ini memuat puluhan interaksi Tabel (Pencarian SKU, Edit Harga inline, Filter Kategori). Memaksakan mereka menggunakan mekanisme baca-tulis manual _Astro Actions_ akan menghasilkan _Technical Debt_ (Hutang Teknis) ke depan bila data produk menumpuk ribuan _record_.

### Keputusan Tindak Lanjut:

Berdasarkan log audit mendalam ini, direkomendasikan untuk segera merancang **Fase F (Katalog Tervalidasi)** yang secara khusus merefaktor ketiga komponen di atas agar sejalan dengan _Data Grid Operasional (tRPC + Svelte Query)_. Langkah ini akan mengunci arsitektur ini menjadi 100% **Hybrid Absolut** tanpa anomali.

---

_Dokumen ini dihasilkan dan disimpan secara terpusat untuk menjaga konsistensi rekayasa aplikasi lintas-fase pengembangan Tim Arsitektur._
