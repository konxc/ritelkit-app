# Dokumentasi Fitur Dashboard Admin - Roti Sholawat

Dashboard Admin pada proyek **Roti Sholawat** merupakan *Software as a Service* internal (Backoffice) yang bertugas sebagai **pusat kendali operasional** dari platform *e-commerce*. Sistem ini diformat sebagai *Single Page Application* behavior melalui framework Svelte 5 (sisi Klien) dan di-render per halamannya menggunakan Astro (sisi Server).

Masing-masing halaman telah dirancang untuk menangani tugas dan entitas spesifik yang saling berkaitan:

## 1. Overview (`/admin`)
Halaman ringkasan eksekutif (*dashboard* utama) yang menampilkan metriks *real-time* kunci terkait kesehatan bisnis. Metriks meliputi:
- Total **Pesanan (Order) Hari Ini**.
- Total **Pendapatan (Revenue) Hari Ini** berdasarkan omset penjualan.
- Jumlah **Produk Aktif** pada etalase toko.
- Jumlah **Draft Pengiriman Aktif** (Fulfillment).
- Jumlah **Kupon Promo Aktif**.
- Jumlah **Refund Pending** yang butuh penanganan manual.

## 2. Kategori (`/admin/categories`)
Fasilitas CRUD (*Create, Read, Update, Delete*) untuk menyusun arsitektur sistem pengelompokan produk. Membantu pelanggan mencari tipe varian dengan lebih mudah pada sisi *front-end* klien, misalnya Roti Manis, Roti Asin, Hampers, dll.

## 3. Produk (`/admin/products`)
Inti dari master data inventaris, tempat admin membuat, mengubah, atau menghapus produk. Fitur yang disajikan:
- Input standar: Nama, Harga, SKU, Kategori, Deskripsi, Stok Awal.
- Integrasi unggah Foto via *Cloud Storage* modern (mendukung *multiple galleries*, *drag & drop*, penentuan thumbnail dan penyusunan urutan media visual).
- Toggle instan untuk menentukan apakah produk berada dalam mode *Draft* (tersembunyi) atau *Aktif* (tayang terbuka untuk pembeli).

## 4. Inventory (`/admin/inventory`)
Fokus pada manajemen dan sinkronisasi logistik atau ketersediaan fisik stok produk yang ada di toko / dapur pembuatan tanpa mengubah harga produk. Admin dapat mengaudit pergerakan stok, menyelaraskan stok (*sync levels*), dan melihat produk mana saja yang butuh di-restok segera (menuju posisi *OOS* / *Out of Stock*).

## 5. Order (`/admin/orders` & `/admin/orders/[id]`)
Manajemen sentral faktur transaksi dari kasir atau *Midtrans Checkout*.
- Menampilkan rekapan status pesanan lengkap mulai dari fase *Pending* (menunggu pembayaran), *Paid* (telah lunas), sampai pesanan tuntas dikirim atau pelanggan *Cancelled*.
- Memperlihatkan detail riwayat alamat pembeli, total angka diskon (kupon), kalkulasi *fee* logistik dan pengiriman, serta metode opsi pembayaran terkonfirmasi.

## 6. Fulfillment (`/admin/fulfillment`)
Pemenuhan operasional dapur dan logistik penjemputan ke tangan kurir, yakni:
- Ekstraksi rute yang terbagi atas status: *Packing* (sedang disiapkan dapur), *Shipped* (sedang dibawa kurir), hingga status final *Delivered* / *Completed*.

## 7. Invoice (`/admin/invoices` & `/admin/invoices/[id]`)
Catatan legalitas finansial internal, membantu mencetak bon digital atau *soft-receipt* dengan nomor *invoice* berurutan. Format ini sangat ramah cetak (printer thermal / dokumen fisik standard) untuk pengarsipan admin akuntansi.

## 8. Refund (`/admin/refunds`)
Sistem terpusat bagi pelanggan yang gagal mendapat barang / pembatalan valid dan wajib diberikan uang kembali (*money-back guarantee*). Mengunci status permintaan pelacakan: *Requested* (Baru diajukan) > *Approved* (Sedang cair) > *Resolved* (Sudah dikembalikan).

## 9. Pelanggan (`/admin/customers`)
Halaman profil agregasi *database buyer* organik, berfungsi mirip dengan *Lightweight CRM* (Customer Relationship Management). Admin bisa:
- Menyimpan identitas no. HP Whatsapp Pelanggan, kontak rujukan, alamat domisili.
- Melihat akumulasi order tiap pelanggan yang bersifat langganan / *whales*.

## 10. Kupon (`/admin/coupons`)
Mesin penarik retensi diskon untuk acara-acara tertentu atau pelanggan VIP:
- Penentuan kode kupon organik (contoh: `BERKAH10`).
- Limitasi besaran nominal kupon berjenis *Fixed Rate* (potongan pasti x-Rupiah) atau *Percentage* (potongan persen).
- Parameter masa aktif *Expired Limit*.

## 11. Pengiriman (`/admin/shipping`)
Sistem penetapan aturan ongkos logistik:
- Integrasi area kurir, parameter kuota bebas biaya kirim (*Free Delivery Threshold*).
- Kalkulasi metode kurir per metrik regional yang tersedia.

## 12. Laporan / Reports (`/admin/reports`)
Ekstraksi data ke level Analisis Bisnis. Mengkalkulasi nilai agregasi performa kuantitatif: Grafik Penjualan Bulanan, Menu/Varian Terlaris, dan Demografi Transaksi. Berguna untuk presentasi dengan owner.

## 13. Iklan (`/admin/ads`)
Dukungan materi media promosi seperti Banner Landing Page (Slider di beranda publik). Admin bisa mengubah gambar unggulan atau memasukkan pesan kampanye *Marketing* ekslusif secara dinamis.

## 14. Konten / CMS (`/admin/cms`)
Pintu khusus untuk mengubah aset statis (*Hardcoded Texts*) non-database ke arah halaman statis website secara on-the-fly (Misal: paragraf sambutan, alamat kontak footer institusi, tautan media sosial Whatsapp / Map Lokasi ritel aktual).

## 15. Notifikasi (`/admin/notifications`)
Apusat peringatan internal sistem dan alert krusial otomatis ke kanal Admin ketika ada *New Order*, stok menipis, ataupun pemberitahuan perselisihan *Refund*.

## 16. Audit (`/admin/audit`)
Pusat dokumentasi *History Logging* (Jejak Rekam). Setiap tindakan `Insert`, `Update`, atau `Delete` pada dashboard oleh setiap admin terindentifikasi tercatat siapa, jam berapa, apa objek transkrip perubahannya di laman tabel Audit ini. 

## 17. Admin Users (`/admin/users`)
Tabel otoritas hak ases pengelolaan internal pekerja sistem (Staff dapur, manajer, dkk). Registrasi dan pencabutan status administrator (*reset password / delete user*).

## 18. Pengaturan (`/admin/settings`)
Halaman modifikasi jantung operasional bisnis, seperti:
- Pengaktifan mode *Pre-order Only* jika dapur overload.
- Jarak Jam Minimum (*Lead time jam*) standar pemesanan di muka.
- Aturan cut-off harian untuk skenario pengiriman *Same Day*.
- Wilayah default layanan / Provinsi markas.

---
Dengan modul berlapis seperti 18 elemen diatas, arsitektur Backoffice Roti Sholawat pada dasarnya mensuplai fitur E-commerce modern setara Enterprise yang bisa mandiri berjalan di dalam server internal maupun infrastruktur *Edge Platform* seperti Cloudflare secara *agnostic*.
