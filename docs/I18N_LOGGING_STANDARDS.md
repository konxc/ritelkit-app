# i18n & Logging Engineering Standards - Roti Sholawat

Dokumen ini menetapkan standar baku untuk implementasi internasionalisasi (i18n) dan konvensi pelaporan sistem (Logging/Errors) untuk memastikan konsistensi pengembangan di seluruh modul.

## 1. Lingkup Internasionalisasi (i18n)

### A. Prioritas Utama: UI Labels & User-Facing Text

Internasionalisasi **hanya** diterapkan pada elemen antarmuka yang berinteraksi langsung dengan pengguna (Frontend), terutama pada **Dashboard Admin**.

- **Wajib i18n**: Label navigasi, header tabel, tombol action, placeholder input, tooltip, dan pesan sukses (toast) yang muncul di UI.
- **Kecuali Storefront**: Halaman publik (beranda, produk publik) tetap menggunakan **Bahasa Indonesia** sebagai bahasa utama tanpa i18n untuk menjaga relevansi pasar lokal Yogyakarta.
- **Kecuali Database**: Data dinamis (nama produk, kategori, konten CMS dari user) saat ini tidak memerlukan dukungan i18n.

### B. Mekanisme Implementasi

Semua teks UI wajib menggunakan fungsi `t()` dari `src/lib/i18n/store.svelte.ts` dengan kunci yang terdefinisi di `src/lib/i18n/translations.ts`.

```typescript
// ✅ BENAR: Menggunakan i18n untuk label
<Button>{t("common.save")}</Button>

// ❌ SALAH: Hardcoded label
<Button>Simpan</Button>
```

---

## 2. Konvensi Logging, Error, & Warning

Untuk menjaga profesionalisme lingkungan pengembangan dan kemudahan debugging global, seluruh pesan sistem yang tidak terlihat langsung di UI (atau bersifat teknis) **wajib menggunakan Bahasa Inggris**.

### A. Standar Bahasa: English Only

Semua entitas berikut harus dalam Bahasa Inggris:

1.  **System Logs**: Log terminal, audit logs (action field), dan debug info.
2.  **Error Messages**: Pesan yang dilempar oleh `throw new Error()`, response dari API/tRPC error, dan validasi skema (Zod).
3.  **Warning Messages**: Peringatan konsol atau status sistem internal.
4.  **Comments**: Komentar kode di dalam file `.ts`, `.svelte`, atau `.astro`.

### B. Struktur Pesan Error

Pesan error harus deskriptif dan mengikuti pola: `[Entity] [Action] [Reason]`

- ✅ `ProductUpdateFailed: SKU conflict detected`
- ✅ `UnauthenticatedAccess: Admin session expired`
- ❌ `Gagal update produk: SKU sudah ada`

---

## 3. Steering Pengembangan

Pengembang wajib mengikuti pedoman ini dalam setiap Pull Request (PR):

1.  **New Feature**: Jika menambahkan modul admin baru, wajib mendaftarkan kunci di `translations.ts`.
2.  **Error Handling**: Pastikan `catch (err)` mencatat log asli dalam Bahasa Inggris ke server/audit table, meskipun di UI hanya menampilkan pesan generic "System Error".
3.  **Audit Logs**: Field `action` pada tabel `audit_logs` harus menggunakan kata kerja Bahasa Inggris (misal: `create_product`, `update_order_status`).

---

> [!IMPORTANT]
> Konsistensi adalah kunci profesionalisme. Melanggar standar logging bahasa (menggunakan non-English untuk log) dianggap sebagai "Technical Debt" yang harus segera diperbaiki.
