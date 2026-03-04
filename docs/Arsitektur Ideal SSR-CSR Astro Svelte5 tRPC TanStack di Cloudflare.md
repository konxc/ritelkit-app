# Arsitektur Ideal SSR/CSR Astro + Svelte 5 + Astro Actions / tRPC di Cloudflare

## Tujuan

Mencapai arsitektur yang:

- cepat di initial load,
- stabil di runtime Cloudflare Worker,
- tetap nyaman untuk interaksi kompleks admin dashboard,
- konsisten dengan Svelte 5 runes.

## Rasionalitas Pemilihan Teknologi (Astro Actions vs tRPC)

### Mengapa Astro Actions?

Astro Actions dipilih sebagai standar modern untuk proyek ini karena:

1. **Native & Zero Setup**: Tidak memerlukan router terpisah atau middleware rumit. Keamanan CSRF dan validasi di-handle langsung oleh Astro.
2. **Type Safety Otomatis**: TypeScript types digenerate langsung dari definisi action tanpa sinkronisasi manual.
3. **Bundle Size Minimal**: Mengurangi ketergantungan pada library client-side seperti TanStack Query untuk mutasi sederhana, yang sangat krusial untuk performa di Cloudflare Edge.
4. **Progressive Enhancement**: Mendukung form submission standar HTML jika JavaScript gagal dimuat.

### Mengapa Tetap Mempertahankan tRPC + TanStack?

1. **Transisi Bertahap**: Memungkinkan tim memigrasikan modul satu per satu tanpa harus merombak seluruh sistem sekaligus.
2. **Kebutuhan Query Kompleks**: Untuk fitur yang membutuhkan caching client-side yang sangat agresif atau sinkronisasi query lintas komponen yang rumit, TanStack Query tetap menyediakan fitur yang lebih matang dibandingkan pemanggilan action manual.

### Kompatibilitas Svelte 5 Runes

Svelte 5 Runes ($state, $derived, $props) bekerja sangat baik dengan kedua pendekatan. Astro Actions memberikan gaya koding yang lebih "vanilla async", sementara tRPC/TanStack tetap bisa digunakan dengan membungkus hasil query ke dalam runes jika diperlukan.

## Prinsip Utama

- Gunakan **SSR-first** di Astro untuk data awal, auth, dan routing guard.
- Gunakan **CSR island** (Svelte) untuk state interaktif, mutation, refetch.
- Jangan full-SSR untuk semua interaksi, dan jangan full-CSR untuk first paint.

---

## [MODERN] Jalur Astro Actions (Rekomendasi Utama)

### Boundary SSR vs CSR

- **SSR (Astro)**:
  - Validasi session/auth menggunakan `Astro.cookies`.
  - Baca query params (`q`, `page`, `limit`).
  - Prefetch data awal via Database service (Drizzle) atau `actions` server call.
  - Kirim data awal ke island Svelte sebagai props.

- **CSR (Svelte island)**:
  - Render tabel/filter/form interaktif.
  - State management menggunakan **Svelte 5 Runes** (`$state`, `$derived`, `$effect`).
  - Query lanjutan dan mutation via **Astro Actions** (`import { actions } from "astro:actions"`).
  - Sinkronisasi URL state untuk filter/pagination.

### Pola Integrasi yang Direkomendasikan

1. Di `.astro`, lakukan fetch awal di server.
2. Render komponen Svelte dengan `client:load`.
3. Di komponen Svelte:
   - Terima data awal sebagai props.
   - Gunakan `$state` untuk menampung data yang bisa berubah.
   - Panggil Actions untuk mutasi data.
   - Refetch data menggunakan Actions setelah mutasi berhasil (atau update state lokal secara optimistik).

### Checklist Implementasi per Halaman Admin

- Ada prefetch data di `.astro`.
- Island Svelte menerima props data awal.
- Menggunakan Svelte 5 Runes untuk reaktivitas.
- Mutasi data menggunakan Astro Actions.
- Lulus `pnpm run validate:all`.
- Lulus `pnpm run build`.

---

## [LEGACY/TRANSITION] Jalur tRPC + TanStack Query

### Boundary SSR vs CSR

- SSR (Astro):
  - validasi session/auth,
  - baca query params (`q`, `page`, `limit`),
  - prefetch data awal via tRPC server caller,
  - kirim data awal ke island Svelte sebagai props.

- CSR (Svelte island):
  - render tabel/filter/form interaktif,
  - query lanjutan dan mutation via TanStack Query + tRPC client,
  - invalidation cache setelah mutation.

### Strategi Data dengan tRPC + TanStack

- Server-side:
  - pakai `createCaller`/server caller for prefetch SSR.

- Client-side:
  - pakai `trpc client` di island untuk query dan mutation.
  - cache key harus deterministik dan identik dengan input query.

### Checklist Implementasi

- Ada prefetch SSR di `.astro`.
- Ada wrapper island + `QueryProvider`.
- Query key SSR dan CSR sinkron (`q/page/limit/offset`).
- Tidak ada syntax legacy `$...Query/$...Mutation`.
- Mutation invalidate key yang benar.
- Lulus `pnpm run validate:svelte`.

---

## Aturan Svelte 5 Runes (Wajib Seluruh Proyek)

- Gunakan `$props()` untuk input (hindari `export let`).
- Gunakan `$state()` untuk internal state.
- Gunakan `$derived()` untuk komputasi state (seperti filter list).
- Gunakan `$effect()` untuk side effects (sinkronisasi URL, log).
- Hindari auto-subscribe legacy style (`$query.data` atau `$ordersQuery`).
- Akses langsung object query/mutation (`ordersQuery.data`, `updateMutation.isPending`).

## Aturan Cloudflare Worker Compatibility

- Hindari package Node-only di jalur runtime server.
- Semua env/config pakai binding Cloudflare (`wrangler.toml` + `wrangler types`).
- Pisahkan utility Node-only untuk script lokal/build-time saja.

## Rekomendasi Operasional

- Tambahkan smoke test Playwright untuk route admin utama agar runtime error cepat terdeteksi.
- Pertahankan satu pola template per kategori halaman (list/detail/settings) supaya konsisten.
- Saat menambah halaman baru, copy dari template yang sudah memenuhi checklist di atas.
