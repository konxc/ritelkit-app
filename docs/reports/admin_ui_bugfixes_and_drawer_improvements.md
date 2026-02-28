# Catatan Perbaikan & Peningkatan UI Admin (Drawer & State)
Tanggal: 28 Februari 2026

Dokumen ini disusun sebagai rekam jejak teknis (*technical log*) atas seluruh perbaikan krusial dan peningkatan performa/UX yang baru saja dilakukan pada panel admin. Tujuannya adalah untuk mencegah terjadinya regresi (*regression*) atau munculnya kembali *bug* serupa di masa mendatang saat pengembangan dilanjutkan.

## 1. Implementasi Sidebar Drawer untuk CRUD
Kami telah memigrasikan form yang membengkak di berbagai halaman pengelola dari *inline form* konvensional ke arsitektur **Right Sidebar Drawer** yang mulus dengan animasi _slide-in_ native-like.
*   **Keuntungan Utama:**
    *   Tabel data kini memanfaatkan 100% *width* dari tab konten, memperbaiki *cognitive load*.
    *   Form dapat digeser masuk ketika admin menekan tombol "Tambah Data" atau mengubah baris, menjaga konteks halaman tetap ada (*backdrop blur effect*).
*   **File Terdampak Peningkatan Ini:**
    *   `src/components/admin/pages/CategoriesManager.svelte`
    *   `src/components/admin/pages/InventoryManager.svelte`
    *   `src/components/admin/pages/ShippingManager.svelte`

## 2. Resolusi Bug _HTML Parsing_ (Malformed Tags & Stray Divs)
Perubahan UI (*refactoring*) yang sebelumnya dilakukan telah meninggalkan sejumlah cacat tata bahasa HTML (unmatched/stray closing `</div>` tags).
*   **Efek Bug:** Menggagalkan proses `pnpm run build` karena _Vite Svelte Plugin_ gagal mengompilasi DOM yang tidak valid/tidak tertutup sempurna akibat elemen *table* yang terbungkus tidak rapi.
*   **Penyelesaian:** Melalui evaluasi mendalam baris-demi-baris, tag `</div>` penutup yang menggantung tak bertuan berhasil dihapuskan secara menyeluruh menggunakan presisi yang ketat.
*   **File yang Terselamatkan dari Error Build:**
    *   `ProductsManager.svelte`
    *   `CategoriesManager.svelte`
    *   `InventoryManager.svelte`
    *   `ShippingManager.svelte`

## 3. Persistent Sidebar di Astro SPA View Transitions
Terdapat *delay* dan kerusakan pada status minimalis (collapsed) Sidebar Admin ketika administrator menavigasi antar halaman (*tab routing*).
*   **Kasus Inti:** Astro.js `ClientRouter` mem-bypass proses `DOMContentLoaded` setiap kali transisi rute (SPA behaviour) dan merusak listener skrip *sidebar toggle*.
*   **Solusi Komprehensif:**
    *   **Anti-FOUC (Flash of Unstyled Content):** Menyematkan `<script is:inline>` di bagian atas dokumen HTML untuk menetapkan kelas CSS `sidebar-collapsed` secara *synchronous* berbasis localStorage sebelum DOM selesai dirender.
    *   **SPA Aware Listeners:** Memindahkan rutinitas logika UI Sidebar ke *Event Listener* standar Astro SPA yakni `astro:page-load` dan menambahkan helper untuk menjamin state tidak hilang sesaat setelah terjadi pertukaran DOM melalui trigger spesifik: `document.addEventListener("astro:after-swap", applySidebarState)`.
*   **Fitur Tambahan:**
    *   Admin tidak lagi dipaksa menekan panah secara presisi dengan mouse; cukup menggunakan kombinasi keyboard **(`Ctrl` + `\`)** untuk expand/minimize sidebar kapan saja secara dinamis karena global listener sekarang aman terhadap isu *memory leak* dari relokasi SPA Astro.
*   **File Terdampak:** `src/layouts/AdminLayout.astro`

## Status Terakhir
- **Production Build:** Sukses 100%
- **Astro/Svelte Adapter:** Stabil
- **Tingkat Resisistensi Cache:** Aman terhadap perpindahan halaman SPA menggunakan `ClientRouter`

Mohon gunakan referensi ini sebagai pedoman apabila terjadi ketaksesuaian tampilan pada integrasi *Sidebar Drawer* maupun SPA Router di update masa depan!
