# Panduan Arsitektur Simulator: SSR Astro + Svelte 5 + Astro Actions

Dokumen ini menjelaskan alur kerja fundamental (end-to-end) dari arsitektur modern Roti Sholawat yang secara utuh telah menggantikan kompleksitas tRPC dan TanStack Query di level operasional (B2B Admin Dashboard). Anda bisa menjajal kode simulasi secara interaktif pada halaman `http://localhost:4321/admin/simulasi`.

---

## 1. Pemanggilan Data Instan (The SSR First Approach)
**File Konteks: `src/pages/admin/simulasi.astro`**

Jika di React SPA atau SPA konvensional dengan tRPC kita harus melakukan ini:
1. Svelte Component Dimuat -> Browser merender *Loading Spinner*.
2. Memanggil `useQuery()` tRPC ke backend.
3. Menunggu (Round Trip Time).
4. Data tiba -> Spinner hilang -> Tabel data muncul.

**Paradigma Baru (Astro SSR):**
Drizzle ORM maupun query *promise* lainnya diproses **secara utuh di dalam server** (di file `.astro`). Halaman HTML dikirim ke browser *sudah berisi data*. 
- **Tidak ada Waterfall** jaringan saat halaman dimuat. Tampilan sepenuhnya instan. 
- **TanStack Query Menjadi Redundan:** Frontend Svelte 5 tidak lagi butuh fitur *fetching* maupun *caching layer* bawaan dari TanStack, karena Svelte hanya perlu menerima hasil SSR tersebut sebagai *props* statis awal (seperti prop `initialData`).

---

## 2. Reaktivitas Lokal & Kecepatan Memori (The Svelte 5 Runes)
**File Konteks: `src/components/admin/pages/SimulasiManager.svelte`**

Komponen Admin UI Roti Sholawat yang rumit sekarang dikelola oleh mekanisme *Runes* bawaan Svelte 5:
- **`$props()`**: Mengambil data statis hasil SSR.
- **`$state()`**: Menyulap data SSR tersebut menjadi *memory state* yang hidup dan reaktif. Jika sebuah item dalam memori ini dihapus, tabel langsung menghilang tanpa menunggu balasan jaringan.
- **`$derived()`**: Digunakan untuk kalkulasi turunan (contoh: menghitung total uang dari list pesanan, atau menjumlah `length` item aktif). Performa $derived jauh lebih hemat (*memoized*) dibanding me-*render* fungsi di dalam HTML-nya Svelte 4.

**Hasilnya?** Kita membuang kompleksitas `queryClient.setQueryData()` (optimistic update TanStack) dan hanya menggunakan fungsi Native JavaScript (seperti `...items, newDbEntry`) yang secara diam-diam dipantau oleh `$state`.

---

## 3. Mutasi Aman (Astro Actions: Sang tRPC Killer)
**File Konteks: Fungsi `handleAdd()` pada `SimulasiManager.svelte`**

Inilah senjata utamanya. Astro Actions telah merangkum semua janji kehebatan tRPC tanpa biaya *overhead* tambahan.
- Fungsi `actions.createDummyItem()` sudah 100% *Type Safe* yang diregistrasikan dari `src/actions/index.ts`.
- Validasi Input (Body & Payload) dijamin oleh Zod di backend.
- Jika ada kesalahan pada tipe data (`number` ditulis `string`), editor (VS Code / WebStorm) akan langsung menyorot merah *function call* tersebut. 

**Alur Kerja Mutasi Linear (Jauh Lebih Bersih dari `useMutation`):**
1. Ubah UI Button menjadi Load (`isSubmitting = true`).
2. Panggil RPC (`await actions.namaMetode()`).
3. Dapatkan respons asinkron (misal berhasil).
4. Pukul rata memori lokal menggunakan `$state` (Svelte merender ulang tabel).
5. Pada blok *finally*, lepaskan UI Button dari fase *loading* (`isSubmitting = false`).

Infrastruktur ini berhasil memangkas ribuan baris kode perampingan *state* dan *fetcher* menjadi logika JavaScript murni dari *top-to-bottom*, serta menutup rapat pintu kebocoran performa akibat duplikasi tipe data backend vs frontend.
