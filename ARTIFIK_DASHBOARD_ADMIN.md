# Dokumentasi Fitur Dashboard Admin - Roti Sholawat

Dashboard Admin pada proyek **Roti Sholawat** merupakan _Software as a Service_ internal (Backoffice) yang bertugas sebagai **pusat kendali operasional** dari platform _e-commerce_. Sistem ini diformat sebagai _Single Page Application_ behavior melalui framework Svelte 5 (sisi Klien) dan di-render per halamannya menggunakan Astro (sisi Server).

Masing-masing halaman telah dirancang untuk menangani tugas dan entitas spesifik yang saling berkaitan:

## 1. Overview (`/admin`)

Halaman ringkasan eksekutif (_dashboard_ utama) yang menampilkan metriks _real-time_ kunci terkait kesehatan bisnis. Metriks meliputi:

- Total **Pesanan (Order) Hari Ini**.
- Total **Pendapatan (Revenue) Hari Ini** berdasarkan omset penjualan.
- Jumlah **Produk Aktif** pada etalase toko.
- Jumlah **Draft Pengiriman Aktif** (Fulfillment).
- Jumlah **Kupon Promo Aktif**.
- Jumlah **Refund Pending** yang butuh penanganan manual.

## 2. Kategori (`/admin/categories`)

Fasilitas CRUD (_Create, Read, Update, Delete_) untuk menyusun arsitektur sistem pengelompokan produk. Membantu pelanggan mencari tipe varian dengan lebih mudah pada sisi _front-end_ klien, misalnya Roti Manis, Roti Asin, Hampers, dll.

## 3. Produk (`/admin/products`)

Inti dari master data inventaris, tempat admin membuat, mengubah, atau menghapus produk. Fitur yang disajikan:

- Input standar: Nama, Harga, SKU, Kategori, Deskripsi, Stok Awal.
- Integrasi unggah Foto via _Cloud Storage_ modern (mendukung _multiple galleries_, _drag & drop_, penentuan thumbnail dan penyusunan urutan media visual).
- Toggle instan untuk menentukan apakah produk berada dalam mode _Draft_ (tersembunyi) atau _Aktif_ (tayang terbuka untuk pembeli).

## 4. Inventory (`/admin/inventory`)

Fokus pada manajemen dan sinkronisasi logistik atau ketersediaan fisik stok produk yang ada di toko / dapur pembuatan tanpa mengubah harga produk. Admin dapat mengaudit pergerakan stok, menyelaraskan stok (_sync levels_), dan melihat produk mana saja yang butuh di-restok segera (menuju posisi _OOS_ / _Out of Stock_).

## 5. Order (`/admin/orders` & `/admin/orders/[id]`)

Manajemen sentral faktur transaksi dari kasir atau _Midtrans Checkout_.

- Menampilkan rekapan status pesanan lengkap mulai dari fase _Pending_ (menunggu pembayaran), _Paid_ (telah lunas), sampai pesanan tuntas dikirim atau pelanggan _Cancelled_.
- Memperlihatkan detail riwayat alamat pembeli, total angka diskon (kupon), kalkulasi _fee_ logistik dan pengiriman, serta metode opsi pembayaran terkonfirmasi.

## 6. Fulfillment (`/admin/fulfillment`)

Pemenuhan operasional dapur dan logistik penjemputan ke tangan kurir, yakni:

- Ekstraksi rute yang terbagi atas status: _Packing_ (sedang disiapkan dapur), _Shipped_ (sedang dibawa kurir), hingga status final _Delivered_ / _Completed_.

## 7. Invoice (`/admin/invoices` & `/admin/invoices/[id]`)

Catatan legalitas finansial internal, membantu mencetak bon digital atau _soft-receipt_ dengan nomor _invoice_ berurutan. Format ini sangat ramah cetak (printer thermal / dokumen fisik standard) untuk pengarsipan admin akuntansi.

## 8. Refund (`/admin/refunds`)

Sistem terpusat bagi pelanggan yang gagal mendapat barang / pembatalan valid dan wajib diberikan uang kembali (_money-back guarantee_). Mengunci status permintaan pelacakan: _Requested_ (Baru diajukan) > _Approved_ (Sedang cair) > _Resolved_ (Sudah dikembalikan).

## 9. Pelanggan (`/admin/customers`)

Halaman profil agregasi _database buyer_ organik, berfungsi mirip dengan _Lightweight CRM_ (Customer Relationship Management). Admin bisa:

- Menyimpan identitas no. HP Whatsapp Pelanggan, kontak rujukan, alamat domisili.
- Melihat akumulasi order tiap pelanggan yang bersifat langganan / _whales_.

## 10. Kupon (`/admin/coupons`)

Mesin penarik retensi diskon untuk acara-acara tertentu atau pelanggan VIP:

- Penentuan kode kupon organik (contoh: `BERKAH10`).
- Limitasi besaran nominal kupon berjenis _Fixed Rate_ (potongan pasti x-Rupiah) atau _Percentage_ (potongan persen).
- Parameter masa aktif _Expired Limit_.

## 11. Pengiriman (`/admin/shipping`)

Sistem penetapan aturan ongkos logistik:

- Integrasi area kurir, parameter kuota bebas biaya kirim (_Free Delivery Threshold_).
- Kalkulasi metode kurir per metrik regional yang tersedia.

## 12. Laporan / Reports (`/admin/reports`)

Ekstraksi data ke level Analisis Bisnis. Mengkalkulasi nilai agregasi performa kuantitatif: Grafik Penjualan Bulanan, Menu/Varian Terlaris, dan Demografi Transaksi. Berguna untuk presentasi dengan owner.

## 13. Iklan (`/admin/ads`)

Dukungan materi media promosi seperti Banner Landing Page (Slider di beranda publik). Admin bisa mengubah gambar unggulan atau memasukkan pesan kampanye _Marketing_ ekslusif secara dinamis.

## 14. Konten / CMS (`/admin/cms`)

Pintu khusus untuk mengubah aset statis (_Hardcoded Texts_) non-database ke arah halaman statis website secara on-the-fly (Misal: paragraf sambutan, alamat kontak footer institusi, tautan media sosial Whatsapp / Map Lokasi ritel aktual).

## 15. Notifikasi (`/admin/notifications`)

Apusat peringatan internal sistem dan alert krusial otomatis ke kanal Admin ketika ada _New Order_, stok menipis, ataupun pemberitahuan perselisihan _Refund_.

## 16. Audit (`/admin/audit`)

Pusat dokumentasi _History Logging_ (Jejak Rekam). Setiap tindakan `Insert`, `Update`, atau `Delete` pada dashboard oleh setiap admin terindentifikasi tercatat siapa, jam berapa, apa objek transkrip perubahannya di laman tabel Audit ini.

## 17. Admin Users (`/admin/users`)

Tabel otoritas hak ases pengelolaan internal pekerja sistem (Staff dapur, manajer, dkk). Registrasi dan pencabutan status administrator (_reset password / delete user_).

## 18. Pengaturan (`/admin/settings`)

Halaman modifikasi jantung operasional bisnis, seperti:

- Pengaktifan mode _Pre-order Only_ jika dapur overload.
- Jarak Jam Minimum (_Lead time jam_) standar pemesanan di muka.
- Aturan cut-off harian untuk skenario pengiriman _Same Day_.
- Wilayah default layanan / Provinsi markas.

---

Dengan modul berlapis seperti 18 elemen diatas, arsitektur Backoffice Roti Sholawat pada dasarnya mensuplai fitur E-commerce modern setara Enterprise yang bisa mandiri berjalan di dalam server internal maupun infrastruktur _Edge Platform_ seperti Cloudflare secara _agnostic_.
