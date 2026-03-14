import type { Client } from "@libsql/client";
import { nowIso } from "@lib/utils";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const isoDaysAgo = (days: number) => new Date(Date.now() - days * MS_PER_DAY).toISOString();

type SampleCategory = {
  name: string;
  slug: string;
};

type SampleProduct = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  categorySlug: string;
  price: number;
  stock: number;
  images: string[];
  metadata: Record<string, unknown>;
};

type SampleCoupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount: number;
  startOffset: number;
  endOffset: number;
  usageLimit: number;
  perUserLimit: number;
};

type SampleCustomer = {
  name: string;
  email: string | null;
  phone: string;
  notes: string;
  createdOffset: number;
};

type SampleAd = {
  name: string;
  channel: string;
  budget: number;
  spend: number;
  status: string;
  startOffset: number;
  endOffset: number;
  notes: string;
};

type SampleCmsPage = {
  slug: string;
  title: string;
  content: string;
};

type SampleShippingRule = {
  name: string;
  type: "flat" | "free_threshold" | "zone";
  priority: number;
  isActive: number;
  config: Record<string, unknown>;
};

type SampleProductReview = {
  productSlug: string;
  customerName: string;
  rating: number;
  comment: string;
  daysAgo: number;
};

type SampleAdminUser = {
  email: string;
  role: string;
};

// Types for seed fixtures

type OrderFixture = {
  orderNo: string;
  status: string;
  paymentStatus: string;
  customerPhone: string;
  customerName: string;
  customerEmail: string | null;
  couponCode: string | null;
  deliveryFee: number;
  notes: string;
  shipping: {
    province: string;
    city: string;
    district: string;
    street: string;
  };
  items: { slug: string; qty: number }[];
  createdOffset: number;
  promo?: Record<string, unknown>;
  payment?: { midtransToken?: string; midtransOrderId?: string };
};

type RefundFixture = {
  orderNo: string;
  amount: number;
  reason: string;
  status: string;
  providerStatus: string;
  createdOffset: number;
};

const sampleCategories: SampleCategory[] = [
  { name: "Roti Manis", slug: "roti-manis" },
  { name: "Roti Tawar", slug: "roti-tawar" },
  { name: "Snack Box", slug: "snack-box" },
  { name: "Kue & Pastry", slug: "kue-pastry" },
  { name: "Donasi Roti", slug: "donasi" },
  { name: "Program Spesial", slug: "program-spesial" },
];

const sampleProducts: SampleProduct[] = [
  {
    name: "Roti Coklat Sholawat",
    slug: "roti-coklat-sholawat",
    sku: "RS-CHOC",
    description: "Roti isi cokelat premium dengan tekstur lembut khas Roti Sholawat.",
    categorySlug: "roti-manis",
    price: 12000,
    stock: 150,
    images: ["/images/products/roti-coklat.jpg"],
    metadata: { highlight: true, flavor: "coklat" },
  },
  {
    name: "Roti Keju Spesial",
    slug: "roti-keju-sholawat",
    sku: "RS-KEJU",
    description: "Ragi alami dengan topping keju cheddar melimpah.",
    categorySlug: "roti-manis",
    price: 14000,
    stock: 120,
    images: ["/images/products/roti-keju.jpg"],
    metadata: { highlight: true, flavor: "keju" },
  },
  {
    name: "Roti Tawar Gandum",
    slug: "roti-tawar-premium",
    sku: "RS-TAWAR",
    description: "Roti tawar gandum sehat, tanpa pengawet, cocok untuk sarapan keluarga.",
    categorySlug: "roti-tawar",
    price: 22000,
    stock: 3,
    images: ["/images/products/roti-tawar.jpg"],
    metadata: { healthy: true, fiber: "high", low_stock_warn: true },
  },
  {
    name: "Snack Box Berkah (Isi 3)",
    slug: "snack-box-syukur",
    sku: "RS-SNACK-B",
    description: "Paket snack box ekonomis untuk acara pengajian atau arisan.",
    categorySlug: "snack-box",
    price: 15000,
    stock: 200,
    images: ["/images/products/snack-box.jpg"],
    metadata: { event_ready: true },
  },
  {
    name: "Donasi 10 Roti Sholawat",
    slug: "donasi-10-roti",
    sku: "DON-10",
    description: "Program donasi roti untuk panti asuhan dan kaum dhuafa.",
    categorySlug: "donasi",
    price: 100000,
    stock: 9999,
    images: ["/images/products/donasi-roti.jpg"],
    metadata: { social_impact: true },
  },
  {
    name: "Paket Jumat Berkah",
    slug: "paket-jumat-berkah",
    sku: "PROG-JUMAT",
    description: "Paket spesial dibagikan setiap hari Jumat setelah sholat.",
    categorySlug: "program-spesial",
    price: 250000,
    stock: 0,
    images: ["/images/products/jumat-berkah.jpg"],
    metadata: { recurring: "weekly", out_of_stock: true },
  },
];

const sampleCoupons: SampleCoupon[] = [
  {
    code: "HEMAT10",
    type: "percent",
    value: 10,
    minOrder: 50000,
    maxDiscount: 20000,
    startOffset: 40,
    endOffset: -7,
    usageLimit: 200,
    perUserLimit: 1,
  },
  {
    code: "BONUS5000",
    type: "fixed",
    value: 5000,
    minOrder: 40000,
    maxDiscount: 5000,
    startOffset: 25,
    endOffset: -2,
    usageLimit: 80,
    perUserLimit: 1,
  },
  {
    code: "EXPIRED20",
    type: "percent",
    value: 20,
    minOrder: 100000,
    maxDiscount: 50000,
    startOffset: 60,
    endOffset: 30,
    usageLimit: 50,
    perUserLimit: 1,
  },
  {
    code: "LIMITREACHED",
    type: "fixed",
    value: 15000,
    minOrder: 50000,
    maxDiscount: 15000,
    startOffset: 10,
    endOffset: -10,
    usageLimit: 5,
    perUserLimit: 1,
  },
];

const sampleCustomers: SampleCustomer[] = [
  {
    name: "Budi Santoso",
    email: "budi@konxc.space",
    phone: "081234567890",
    notes: "Pelanggan setia sejak 2024. Suka roti coklat.",
    createdOffset: 60,
  },
  {
    name: "Siti Aminah",
    email: "siti@gmail.com",
    phone: "081987654321",
    notes: "Koordinator pengajian Masjid Agung.",
    createdOffset: 45,
  },
  {
    name: "Andi Wijaya",
    email: "andi.w@perusahaan.co.id",
    phone: "085566778899",
    notes: "Corporate client - PT Maju Mundur.",
    createdOffset: 30,
  },
  {
    name: "Dewi Lestari",
    email: "dewi.lestari@test.com",
    phone: "087711223344",
    notes: "Sering pesan paket donasi.",
    createdOffset: 15,
  },
  {
    name: "Rizky Anisa",
    email: "rizky@roti-sholawat.test",
    phone: "085612345678",
    notes: "Pelanggan VIP, sering pesan untuk acara.",
    createdOffset: 50,
  },
  {
    name: "Nisa Dewi",
    email: "nisa@roti-sholawat.test",
    phone: "082345678901",
    notes: "Pelanggan aktif komunitas pengajian RT.",
    createdOffset: 35,
  },
];

const sampleAds: SampleAd[] = [
  {
    name: "Promo Lebaran",
    channel: "Instagram",
    budget: 600000,
    spend: 380000,
    status: "active",
    startOffset: 20,
    endOffset: -5,
    notes: "Segment DIY dan Solo",
  },
  {
    name: "WhatsApp Blast Komunitas",
    channel: "WhatsApp",
    budget: 250000,
    spend: 230000,
    status: "completed",
    startOffset: 60,
    endOffset: 10,
    notes: "Retention pelanggan regular",
  },
  {
    name: "Google Shopping Roti Artisan",
    channel: "Google Ads",
    budget: 1000000,
    spend: 720000,
    status: "active",
    startOffset: 15,
    endOffset: -14,
    notes: "Keyword: roti halal Yogyakarta, roti sholawat",
  },
  {
    name: "TikTok Konten Dapur",
    channel: "TikTok",
    budget: 400000,
    spend: 150000,
    status: "active",
    startOffset: 7,
    endOffset: -21,
    notes: "Video behind-the-scenes proses pembuatan roti",
  },
  {
    name: "Facebook Remarketing",
    channel: "Facebook",
    budget: 350000,
    spend: 350000,
    status: "completed",
    startOffset: 45,
    endOffset: 15,
    notes: "Target pengunjung website yang belum checkout",
  },
  {
    name: "Email Newsletter Jumat Berkah",
    channel: "Email",
    budget: 50000,
    spend: 35000,
    status: "completed",
    startOffset: 30,
    endOffset: 23,
    notes: "Blast ke 500+ subscriber newsletter",
  },
];

const sampleCmsPages: SampleCmsPage[] = [
  {
    slug: "tentang-kami",
    title: "Tentang Roti Sholawat",
    content: `
# Menebar Kebaikan Lewat Sepotong Roti

Di Roti Sholawat, kami percaya bahwa bisnis bukan sekadar mencari keuntungan, tapi juga tentang kebermanfaatan. Setiap butir gandum dan tetes air yang kami olah diiringi dengan doa dan sholawat.

![Kitchen](/images/cms/kitchen.jpg)

### Visi Kami
Menjadi rujukan roti halal, thayyib, dan berkah yang dapat dinikmati oleh seluruh lapisan masyarakat Indonesia.

### Mengapa Roti Sholawat?
1. **Bahan Premium**: Kami menggunakan bahan-bahan pilihan tanpa pengawet buatan.
2. **Higienis**: Proses produksi yang bersih sesuai standar kesehatan.
3. **Penuh Berkah**: Sebagian keuntungan dialokasikan untuk program donasi rutin.
    `,
  },
  {
    slug: "program-donasi",
    title: "Program Donasi Roti",
    content: `
# Berbagi Kebahagiaan untuk Mereka yang Membutuhkan

Melalui program ini, Anda dapat ikut serta dalam gerakan menebar kebaikan. Setiap paket donasi yang Anda beli akan kami salurkan ke panti asuhan, masjid, dan kaum dhuafa di area Yogyakarta dan sekitarnya.

![Donation](/images/cms/donation-event.jpg)

### Cara Ikut Serta:
1. Pilih produk kategori **Donasi** di menu kami.
2. Tentukan jumlah paket yang ingin didonasikan.
3. Kami akan mengirimkan laporan penyaluran kepada Anda melalui WhatsApp/Email.
    `,
  },
  {
    slug: "testimoni",
    title: "Testimoni Komunitas",
    content:
      "## Cerita Roti Sholawat\n- Komunitas #1: Rasa memikat hati.\n- Komunitas #2: Packing rapi dan tiba tepat waktu.",
  },
];

const sampleShippingRules: SampleShippingRule[] = [
  {
    name: "Antar Lokal - Flat",
    type: "flat",
    priority: 10,
    isActive: 1,
    config: { fee: 15000 },
  },
  {
    name: "Gratis > 200k (Lokal)",
    type: "free_threshold",
    priority: 20,
    isActive: 1,
    config: { threshold: 200000, fee: 15000 },
  },
  {
    name: "Zona Antar Kota Jawa",
    type: "zone",
    priority: 30,
    isActive: 1,
    config: {
      zones: [
        { name: "Semarang", fee: 25000 },
        { name: "Solo", fee: 20000 },
        { name: "Surabaya", fee: 35000 },
        { name: "Jakarta", fee: 40000 },
      ],
    },
  },
];

const sampleReviews: SampleProductReview[] = [
  {
    productSlug: "roti-coklat-sholawat",
    customerName: "Budi Santoso",
    rating: 5,
    comment: "Cokelatnya lumer banget, roti paling enak di Sleman!",
    daysAgo: 2,
  },
  {
    productSlug: "roti-coklat-sholawat",
    customerName: "Siti Aminah",
    rating: 4,
    comment: "Enak, tapi pengiriman agak lama sedikit siang tadi.",
    daysAgo: 5,
  },
  {
    productSlug: "roti-coklat-sholawat",
    customerName: "Rizky Anisa",
    rating: 5,
    comment: "Selalu beli ini tiap minggu, keluarga suka banget!",
    daysAgo: 3,
  },
  {
    productSlug: "roti-keju-sholawat",
    customerName: "Andi Wijaya",
    rating: 5,
    comment: "Kejunya melimpah premium bukan kaleng-kaleng.",
    daysAgo: 10,
  },
  {
    productSlug: "roti-keju-sholawat",
    customerName: "Nisa Dewi",
    rating: 4,
    comment: "Rasanya enak, prefer yang lebih asin dikit. Overall oke!",
    daysAgo: 8,
  },
  {
    productSlug: "roti-tawar-premium",
    customerName: "Dewi Lestari",
    rating: 5,
    comment: "Teksturnya empuk banget, anak saya suka buat bekal sekolah.",
    daysAgo: 1,
  },
  {
    productSlug: "snack-box-syukur",
    customerName: "Siti Aminah",
    rating: 5,
    comment: "Cocok banget untuk acara pengajian, tamu-tamu sangat puas!",
    daysAgo: 7,
  },
  {
    productSlug: "snack-box-syukur",
    customerName: "Budi Santoso",
    rating: 4,
    comment: "Enak dan harga terjangkau. Porsi pas untuk snack.",
    daysAgo: 12,
  },
  {
    productSlug: "donasi-10-roti",
    customerName: "Dewi Lestari",
    rating: 5,
    comment: "Senang bisa berbagi, pelaporan donasi juga cepat via WA. Semoga berkah!",
    daysAgo: 4,
  },
  {
    productSlug: "donasi-10-roti",
    customerName: "Andi Wijaya",
    rating: 5,
    comment: "Program mulia, rutin donasi setiap bulan. Recommended!",
    daysAgo: 14,
  },
];

const sampleAdmins: SampleAdminUser[] = [
  { email: "admin@konxc.space", role: "owner" },
  { email: "staff@konxc.space", role: "staff" },
  { email: "editor@konxc.space", role: "editor" },
];

const orderFixtures: OrderFixture[] = [
  {
    orderNo: "RS-20260226-001",
    status: "processing",
    paymentStatus: "paid",
    customerPhone: "081234567890",
    customerName: "Budi Santoso",
    customerEmail: "budi@konxc.space",
    couponCode: "HEMAT10",
    deliveryFee: 15000,
    notes: "Tolong kirim sebelum jam 10 pagi.",
    shipping: { province: "DI Yogyakarta", city: "Sleman", district: "Mlati", street: "Jl. Magelang KM 5" },
    items: [{ slug: "roti-coklat-sholawat", qty: 5 }, { slug: "roti-keju-sholawat", qty: 5 }],
    createdOffset: 0,
    promo: { channel: "google-ads" },
    payment: { midtransToken: "tok_123", midtransOrderId: "MT-RS-001" },
  },
  {
    orderNo: "RS-20260225-002",
    status: "delivered",
    paymentStatus: "paid",
    customerPhone: "081987654321",
    customerName: "Siti Aminah",
    customerEmail: "siti@gmail.com",
    couponCode: null,
    deliveryFee: 0,
    notes: "Paket Snack Box untuk masjid.",
    shipping: { province: "DI Yogyakarta", city: "Yogyakarta", district: "Gondokusuman", street: "Jl. Solo No. 12" },
    items: [{ slug: "snack-box-syukur", qty: 50 }],
    createdOffset: 1,
    promo: { channel: "facebook" },
    payment: { midtransToken: "tok_456", midtransOrderId: "MT-RS-002" },
  },
  // === Orders untuk Rizky Anisa (085612345678) ===
  {
    orderNo: "RS-20260212-003",
    status: "shipped",
    paymentStatus: "paid",
    customerPhone: "085612345678",
    customerName: "Rizky Anisa",
    customerEmail: "rizky@roti-sholawat.test",
    couponCode: "HEMAT10",
    deliveryFee: 15000,
    notes: "Hadiah ulang tahun suami, tolong dikemas cantik.",
    shipping: { province: "DI Yogyakarta", city: "Sleman", district: "Depok", street: "Jl. Kaliurang KM 8" },
    items: [{ slug: "roti-coklat-sholawat", qty: 4 }, { slug: "roti-keju-sholawat", qty: 4 }],
    createdOffset: 2,
    promo: { channel: "instagram" },
    payment: { midtransToken: "tok_789", midtransOrderId: "MT-RS-003" },
  },
  {
    orderNo: "RS-20260205-004",
    status: "completed",
    paymentStatus: "paid",
    customerPhone: "085612345678",
    customerName: "Rizky Anisa",
    customerEmail: "rizky@roti-sholawat.test",
    couponCode: null,
    deliveryFee: 0,
    notes: "Pesanan bulanan rutin.",
    shipping: { province: "DI Yogyakarta", city: "Sleman", district: "Depok", street: "Jl. Kaliurang KM 8" },
    items: [{ slug: "snack-box-syukur", qty: 20 }, { slug: "roti-tawar-premium", qty: 2 }],
    createdOffset: 9,
    promo: { channel: "organic" },
    payment: { midtransToken: "tok_790", midtransOrderId: "MT-RS-004" },
  },
  {
    orderNo: "RS-20260228-012",
    status: "delivered",
    paymentStatus: "paid",
    customerPhone: "085612345678",
    customerName: "Rizky Anisa",
    customerEmail: "rizky@roti-sholawat.test",
    couponCode: "BONUS5000",
    deliveryFee: 15000,
    notes: "Pesanan untuk arisan RT.",
    shipping: { province: "DI Yogyakarta", city: "Sleman", district: "Mlati", street: "Jl. Anggrek No. 5" },
    items: [{ slug: "roti-coklat-sholawat", qty: 6 }, { slug: "donasi-10-roti", qty: 1 }],
    createdOffset: 0,
    promo: { channel: "whatsapp" },
    payment: { midtransToken: "tok_810", midtransOrderId: "MT-RS-012" },
  },
  // === Orders untuk Nisa Dewi (082345678901) ===
  {
    orderNo: "RS-20260208-005",
    status: "completed",
    paymentStatus: "paid",
    customerPhone: "082345678901",
    customerName: "Nisa Dewi",
    customerEmail: "nisa@roti-sholawat.test",
    couponCode: null,
    deliveryFee: 0,
    notes: "Pesanan untuk acara tahlilan.",
    shipping: { province: "DI Yogyakarta", city: "Bantul", district: "Sewon", street: "Jl. Bantul KM 3" },
    items: [{ slug: "roti-keju-sholawat", qty: 3 }, { slug: "roti-coklat-sholawat", qty: 3 }],
    createdOffset: 6,
    promo: { channel: "word-of-mouth" },
    payment: { midtransToken: "tok_791", midtransOrderId: "MT-RS-005" },
  },
  {
    orderNo: "RS-20260215-006",
    status: "processing",
    paymentStatus: "paid",
    customerPhone: "082345678901",
    customerName: "Nisa Dewi",
    customerEmail: "nisa@roti-sholawat.test",
    couponCode: "HEMAT10",
    deliveryFee: 15000,
    notes: "Pesanan rutin mingguan.",
    shipping: { province: "DI Yogyakarta", city: "Bantul", district: "Sewon", street: "Jl. Bantul KM 3" },
    items: [{ slug: "snack-box-syukur", qty: 10 }],
    createdOffset: 0,
    promo: { channel: "organic" },
    payment: { midtransToken: "tok_792", midtransOrderId: "MT-RS-006" },
  },
  // === Orders target untuk Refund ===
  {
    orderNo: "RS-20260203-007",
    status: "cancelled",
    paymentStatus: "paid",
    customerPhone: "081234567890",
    customerName: "Budi Santoso",
    customerEmail: "budi@konxc.space",
    couponCode: null,
    deliveryFee: 15000,
    notes: "Pesanan dibatalkan karena double order.",
    shipping: { province: "DI Yogyakarta", city: "Sleman", district: "Mlati", street: "Jl. Magelang KM 5" },
    items: [{ slug: "roti-coklat-sholawat", qty: 5 }],
    createdOffset: 11,
    promo: { channel: "organic" },
    payment: { midtransToken: "tok_793", midtransOrderId: "MT-RS-007" },
  },
  {
    orderNo: "RS-20260201-008",
    status: "delivered",
    paymentStatus: "refunded",
    customerPhone: "081987654321",
    customerName: "Siti Aminah",
    customerEmail: "siti@gmail.com",
    couponCode: null,
    deliveryFee: 0,
    notes: "Produk tidak sesuai pesanan, refund disetujui.",
    shipping: { province: "DI Yogyakarta", city: "Yogyakarta", district: "Gondokusuman", street: "Jl. Solo No. 12" },
    items: [{ slug: "roti-tawar-premium", qty: 5 }],
    createdOffset: 13,
    promo: { channel: "organic" },
    payment: { midtransToken: "tok_794", midtransOrderId: "MT-RS-008" },
  },
  {
    orderNo: "RS-20260218-009",
    status: "cancelled",
    paymentStatus: "paid",
    customerPhone: "085566778899",
    customerName: "Andi Wijaya",
    customerEmail: "andi.w@perusahaan.co.id",
    couponCode: null,
    deliveryFee: 35000,
    notes: "Event korporat dibatalkan mendadak, mohon refund.",
    shipping: { province: "Jawa Tengah", city: "Semarang", district: "Banyumanik", street: "Jl. Ngesrep No. 7" },
    items: [{ slug: "snack-box-syukur", qty: 100 }],
    createdOffset: 0,
    promo: { channel: "sales-team" },
    payment: { midtransToken: "tok_795", midtransOrderId: "MT-RS-009" },
  },
  {
    orderNo: "RS-20260206-010",
    status: "cancelled",
    paymentStatus: "paid",
    customerPhone: "087711223344",
    customerName: "Dewi Lestari",
    customerEmail: "dewi.lestari@test.com",
    couponCode: null,
    deliveryFee: 15000,
    notes: "Salah pilih produk, minta cancel dan refund.",
    shipping: { province: "DI Yogyakarta", city: "Yogyakarta", district: "Umbulharjo", street: "Jl. Veteran No. 22" },
    items: [{ slug: "paket-jumat-berkah", qty: 1 }],
    createdOffset: 8,
    promo: { channel: "organic" },
    payment: { midtransToken: "tok_796", midtransOrderId: "MT-RS-010" },
  },
  {
    orderNo: "RS-20260211-011",
    status: "delivered",
    paymentStatus: "refunded",
    customerPhone: "085612345678",
    customerName: "Rizky Anisa",
    customerEmail: "rizky@roti-sholawat.test",
    couponCode: null,
    deliveryFee: 15000,
    notes: "Produk rusak saat pengiriman, partial refund ongkir.",
    shipping: { province: "DI Yogyakarta", city: "Sleman", district: "Depok", street: "Jl. Kaliurang KM 8" },
    items: [{ slug: "roti-coklat-sholawat", qty: 8 }],
    createdOffset: 3,
    promo: { channel: "instagram" },
    payment: { midtransToken: "tok_797", midtransOrderId: "MT-RS-011" },
  },
];

const refundFixtures: RefundFixture[] = [
  {
    orderNo: "RS-20260203-007",
    amount: 75000,
    reason: "Double order / pesanan dibatalkan oleh pelanggan",
    status: "completed",
    providerStatus: "refunded",
    createdOffset: 10,
  },
  {
    orderNo: "RS-20260201-008",
    amount: 110000,
    reason: "Produk tidak sesuai pesanan, seluruh jumlah dikembalikan",
    status: "completed",
    providerStatus: "refunded",
    createdOffset: 12,
  },
  {
    orderNo: "RS-20260218-009",
    amount: 1535000,
    reason: "Event korporat dibatalkan mendadak oleh klien",
    status: "processing",
    providerStatus: "pending",
    createdOffset: 0,
  },
  {
    orderNo: "RS-20260206-010",
    amount: 265000,
    reason: "Pelanggan salah pilih produk sebelum diproses",
    status: "completed",
    providerStatus: "refunded",
    createdOffset: 7,
  },
  {
    orderNo: "RS-20260211-011",
    amount: 15000,
    reason: "Refund ongkir karena produk rusak saat pengiriman",
    status: "completed",
    providerStatus: "refunded",
    createdOffset: 2,
  },
];

// Fixtures formerly used for manual seeding, now handled dynamically via ensureNotifications and ensureCouponUsages

type SeedOptions = {
  adminEmail: string;
  tenantId?: string; // Tenant target untuk data ini
  tenantSlug?: string;
  tenantName?: string;
  now?: string;
};

export async function seedAdminData(db: Client, options: SeedOptions) {
  const now = options.now ?? nowIso();
  const tenantId = options.tenantId ?? "seed-tenant-id";
  const tenantSlug = options.tenantSlug ?? "ritelkit-app";
  const tenantName = options.tenantName ?? "RitelKit Admin";

  await ensureTenant(db, { id: tenantId, slug: tenantSlug, name: tenantName }, now);
  
  await ensureAdminUsers(db, tenantId, now);
  await ensureCategories(db, tenantId, now);
  const categoryMap = await buildCategoryMap(db, tenantId);
  await ensureProducts(db, tenantId, now, categoryMap);
  const productMap = await buildProductMap(db, tenantId);
  await ensureProductReviews(db, tenantId, productMap);
  await ensureCoupons(db, tenantId, now);
  const couponMap = await buildCouponMap(db, tenantId);
  await ensureCustomers(db, tenantId);
  const customerMap = await buildCustomerMap(db, tenantId);
  await ensureSettings(db, tenantId, now);
  await ensureAds(db, tenantId, now);
  await ensureCmsPages(db, tenantId, now);
  await ensureShippingRules(db, tenantId, now);

  // Orders now handle their own RELATIONAL history, movements, invoices, and shipments
  await ensureOrders(db, tenantId, couponMap, productMap, customerMap);

  const orderMap = await buildOrderMap(db, tenantId);
  await ensureRefunds(db, tenantId, orderMap); // Still handles specific refund fixture
  await ensureCouponUsages(db, tenantId, couponMap);
  await ensureNotifications(db, tenantId);
  await ensureAuditLogs(db, tenantId, now, options.adminEmail, orderMap, productMap);
}

async function ensureTenant(db: Client, tenant: { id: string, slug: string, name: string }, now: string) {
  const exists = await db.execute({
    sql: "SELECT id FROM tenants WHERE id = ?",
    args: [tenant.id]
  });
  if (exists.rows.length > 0) return;

  await db.execute({
    sql: "INSERT INTO tenants (id, slug, name, industry, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [tenant.id, tenant.slug, tenant.name, "bakery", now, now]
  });
}

async function ensureAdminUsers(db: Client, tenantId: string, now: string) {
  const count = await db.execute({
    sql: "SELECT COUNT(*) as count FROM admin_users WHERE tenant_id = ?",
    args: [tenantId]
  });
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 1) return; // Allow 1 default admin
  for (const admin of sampleAdmins) {
    // Skip if already exists
    const exists = await db.execute({
      sql: "SELECT email FROM admin_users WHERE email = ?",
      args: [admin.email],
    });
    if (exists.rows.length > 0) continue;

    await db.execute({
      sql: "INSERT INTO admin_users (id, tenant_id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [
        crypto.randomUUID(),
        tenantId,
        admin.email,
        "120000:salt:hash", // placeholder, real login needs hashPassword
        admin.role,
        now,
      ],
    });
  }
}

async function ensureCategories(db: Client, tenantId: string, now: string) {
  for (const cat of sampleCategories) {
    const exists = await db.execute({
      sql: "SELECT id FROM categories WHERE slug = ? AND tenant_id = ?",
      args: [cat.slug, tenantId],
    });
    if (exists.rows.length > 0) continue;

    await db.execute({
      sql: "INSERT INTO categories (id, tenant_id, name, slug, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [crypto.randomUUID(), tenantId, cat.name, cat.slug, 0, 1, now, now],
    });
  }
}

async function buildCategoryMap(db: Client, tenantId: string) {
  const result = await db.execute({
    sql: "SELECT id, slug FROM categories WHERE tenant_id = ?",
    args: [tenantId]
  });
  const map: Record<string, string> = {};
  for (const row of result.rows) {
    const r = row as unknown as { id: string; slug: string };
    map[r.slug] = r.id;
  }
  return map;
}

async function ensureProducts(db: Client, tenantId: string, now: string, categoryMap: Record<string, string>) {
  for (const product of sampleProducts) {
    const exists = await db.execute({
      sql: "SELECT id, sku FROM products WHERE slug = ? AND tenant_id = ?",
      args: [product.slug, tenantId],
    });
    if (exists.rows.length > 0) {
      // Patch missing SKU if product exists but SKU is null/empty
      const row = exists.rows[0] as { id?: string; sku?: string | null };
      if (!row.sku && row.id) {
        await db.execute({
          sql: "UPDATE products SET sku = ?, updated_at = ? WHERE id = ?",
          args: [product.sku, now, row.id],
        });
      }
      continue;
    }
    const categoryId = categoryMap[product.categorySlug] || null;
    await db.execute({
      sql: `INSERT INTO products (id, tenant_id, sku, name, slug, description, category_id, price, cost, stock, is_active, images_json, metadata_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        tenantId,
        product.sku,
        product.name,
        product.slug,
        product.description,
        categoryId,
        product.price,
        Math.round(product.price * 0.58),
        product.stock,
        1,
        JSON.stringify(product.images),
        JSON.stringify(product.metadata),
        now,
        now,
      ],
    });
  }
}

async function ensureProductReviews(db: Client, tenantId: string, productMap: Record<string, { id: string }>) {
  for (const review of sampleReviews) {
    const product = productMap[review.productSlug];
    if (!product) continue;
    // Idempotent: skip if same product+customer combination already exists for this tenant
    const exists = await db.execute({
      sql: "SELECT id FROM product_reviews WHERE product_id = ? AND customer_name = ? AND tenant_id = ?",
      args: [product.id, review.customerName, tenantId],
    });
    if (exists.rows.length > 0) continue;
    await db.execute({
      sql: `INSERT INTO product_reviews (id, tenant_id, product_id, customer_name, rating, comment, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        tenantId,
        product.id,
        review.customerName,
        review.rating,
        review.comment,
        1,
        isoDaysAgo(review.daysAgo),
      ],
    });
  }
}

async function ensureCoupons(db: Client, tenantId: string, now: string) {
  for (const coupon of sampleCoupons) {
    const exists = await db.execute({
      sql: "SELECT id FROM coupons WHERE code = ? AND tenant_id = ?",
      args: [coupon.code, tenantId],
    });
    if (exists.rows.length > 0) continue;
    await db.execute({
      sql: `INSERT INTO coupons (id, tenant_id, code, type, value, min_order, max_discount, start_at, end_at, usage_limit, per_user_limit, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        tenantId,
        coupon.code,
        coupon.type,
        coupon.value,
        coupon.minOrder,
        coupon.maxDiscount,
        isoDaysAgo(coupon.startOffset),
        isoDaysAgo(coupon.endOffset),
        coupon.usageLimit,
        coupon.perUserLimit,
        1,
        now,
        now,
      ],
    });
  }
}

async function ensureCustomers(db: Client, tenantId: string) {
  for (const customer of sampleCustomers) {
    const exists = await db.execute({
      sql: "SELECT id FROM customers WHERE phone = ? AND tenant_id = ?",
      args: [customer.phone, tenantId],
    });
    if (exists.rows.length > 0) continue;
    await db.execute({
      sql: `INSERT INTO customers (id, tenant_id, name, email, phone, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        tenantId,
        customer.name,
        customer.email,
        customer.phone,
        customer.notes,
        isoDaysAgo(customer.createdOffset),
        isoDaysAgo(customer.createdOffset),
      ],
    });
  }
}

async function ensureSettings(db: Client, tenantId: string, now: string) {
  const count = await db.execute({
    sql: "SELECT COUNT(*) as count FROM settings WHERE tenant_id = ?",
    args: [tenantId]
  });
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;
  await db.execute({
    sql: "INSERT INTO settings (key, tenant_id, value_json, updated_at) VALUES (?, ?, ?, ?)",
    args: [
      "order_settings",
      tenantId,
      JSON.stringify({
        preorder_only: false,
        same_day_enabled: true,
        minimum_lead_time_hours: 2,
      }),
      now,
    ],
  });
  await db.execute({
    sql: "INSERT INTO settings (key, tenant_id, value_json, updated_at) VALUES (?, ?, ?, ?)",
    args: [
      "delivery_settings",
      tenantId,
      JSON.stringify({
        delivery_province: "DI Yogyakarta",
        free_delivery_threshold: 150000,
      }),
      now,
    ],
  });

  // Tambahkan juga metadata tenant di settings (opsional, tapi berguna untuk tenant-resolver)
  await db.execute({
    sql: "INSERT INTO settings (key, tenant_id, value_json, updated_at) VALUES (?, ?, ?, ?)",
    args: [
      "tenant_metadata",
      tenantId,
      JSON.stringify({ name: "Demo Store", slug: "demo" }), // ini biasanya dihandle real di tenants table
      now,
    ],
  });
}

async function ensureAds(db: Client, tenantId: string, now: string) {
  for (const ad of sampleAds) {
    const exists = await db.execute({
      sql: "SELECT id FROM ads_campaigns WHERE name = ? AND tenant_id = ?",
      args: [ad.name, tenantId],
    });
    if (exists.rows.length > 0) continue;
    await db.execute({
      sql: `INSERT INTO ads_campaigns (id, tenant_id, name, channel, budget, spend, status, start_at, end_at, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        tenantId,
        ad.name,
        ad.channel,
        ad.budget,
        ad.spend,
        ad.status,
        isoDaysAgo(ad.startOffset),
        isoDaysAgo(ad.endOffset),
        ad.notes,
        now,
        now,
      ],
    });
  }
}

async function ensureCmsPages(db: Client, tenantId: string, now: string) {
  for (const page of sampleCmsPages) {
    const exists = await db.execute({
      sql: "SELECT id FROM cms_pages WHERE slug = ? AND tenant_id = ?",
      args: [page.slug, tenantId],
    });
    if (exists.rows.length > 0) continue;
    await db.execute({
      sql: `INSERT INTO cms_pages (id, tenant_id, slug, title, content_md, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), tenantId, page.slug, page.title, page.content, 1, now, now],
    });
  }
}

async function ensureShippingRules(db: Client, tenantId: string, now: string) {
  const count = await db.execute({
    sql: "SELECT COUNT(*) as count FROM shipping_rules WHERE tenant_id = ?",
    args: [tenantId]
  });
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;
  for (const rule of sampleShippingRules) {
    await db.execute({
      sql: `INSERT INTO shipping_rules (id, tenant_id, name, type, priority, is_active, config_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        tenantId,
        rule.name,
        rule.type,
        rule.priority,
        rule.isActive,
        JSON.stringify(rule.config),
        now,
        now,
      ],
    });
  }
}

async function ensureOrders(
  db: Client,
  tenantId: string,
  couponMap: Record<string, { id: string; type: string; value: number; max_discount: number | null }>,
  productMap: Record<string, { id: string; price: number; slug: string; name: string }>,
  customerMap: Record<string, string>,
) {
  // 1. Insert fixed fixtures — idempotent per order_no
  for (const fixture of orderFixtures) {
    const exists = await db.execute({
      sql: "SELECT id FROM orders WHERE order_no = ? AND tenant_id = ?",
      args: [fixture.orderNo, tenantId],
    });
    if (exists.rows.length > 0) continue;
    await insertOrderFullRelational(db, tenantId, fixture, couponMap, productMap, customerMap);
  }

  // 2. Only generate random historical orders if none exist yet
  const randCount = await db.execute({
    sql: "SELECT COUNT(*) as count FROM orders WHERE order_no LIKE 'RS-RAND-%' AND tenant_id = ?",
    args: [tenantId]
  });
  if (Number((randCount.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;

  const productSlugs = Object.keys(productMap);
  const statuses = ["pending", "processing", "shipped", "delivered", "completed", "cancelled"];
  const paymentStatuses = ["unpaid", "paid", "paid", "paid", "failed"];
  const cities = ["Jakarta", "Surabaya", "Solo", "Bandung", "Semarang", "Yogya"];

  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const customer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const pStatus =
      status === "cancelled" ? "unpaid" : paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];

    const randomItems = [];
    const itemNum = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < itemNum; j++) {
      randomItems.push({
        slug: productSlugs[Math.floor(Math.random() * productSlugs.length)],
        qty: Math.floor(Math.random() * 3) + 1,
      });
    }

    const fixture: OrderFixture = {
      orderNo: `RS-RAND-${1000 + i}`,
      status,
      paymentStatus: pStatus,
      customerPhone: customer.phone,
      customerName: customer.name,
      customerEmail: customer.email,
      couponCode: Math.random() > 0.8 ? "HEMAT10" : null,
      deliveryFee: city === "Yogya" ? 0 : 15000 + Math.floor(Math.random() * 20000),
      notes: "Auto-generated historical data",
      shipping: {
        province: city === "Yogya" ? "DI Yogyakarta" : "Luar DIY",
        city,
        district: "Kecamatan",
        street: `Jl. Demangan Baru No. ${i + 1}`,
      },
      items: randomItems,
      createdOffset: daysAgo,
      promo: { channel: Math.random() > 0.5 ? "google-ads" : "organic" },
      payment: {},
    };

    await insertOrderFullRelational(db, tenantId, fixture, couponMap, productMap, customerMap);
  }
}

async function insertOrderFullRelational(
  db: Client,
  tenantId: string,
  fixture: OrderFixture,
  couponMap: Record<string, { id: string; type: string; value: number; max_discount: number | null }>,
  productMap: Record<string, { id: string; price: number; slug: string; name: string }>,
  customerMap: Record<string, string>,
) {
  const items = fixture.items
    .map((item) => {
      const product = productMap[item.slug];
      if (!product) return null;
      return { product_id: product.id, qty: item.qty, price: product.price, name: product.name };
    })
    .filter((item): item is { product_id: string; qty: number; price: number; name: string } => Boolean(item));

  if (items.length === 0) return;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  let discountTotal = 0;
  let couponCode = fixture.couponCode;

  if (couponCode && couponMap[couponCode]) {
    const coupon = couponMap[couponCode];
    discountTotal =
      coupon.type === "percent"
        ? Math.min(Math.round((subtotal * coupon.value) / 100), coupon.max_discount ?? subtotal)
        : coupon.value;
  } else {
    couponCode = null;
  }

  const total = subtotal - discountTotal + fixture.deliveryFee;
  const createdAt = isoDaysAgo(fixture.createdOffset);
  const orderId = crypto.randomUUID();
  const customerId = customerMap[fixture.customerPhone] || null;

  // 1. Insert Order
  await db.execute({
    sql: `INSERT INTO orders (id, tenant_id, order_no, status, payment_status, customer_id, customer_name, customer_email, customer_phone, shipping_address_json, items_json, subtotal, discount_total, delivery_fee, total, coupon_code, promo_json, notes, midtrans_token, midtrans_order_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      orderId,
      tenantId,
      fixture.orderNo,
      fixture.status,
      fixture.paymentStatus,
      customerId,
      fixture.customerName,
      fixture.customerEmail,
      fixture.customerPhone,
      JSON.stringify(fixture.shipping),
      JSON.stringify(items),
      subtotal,
      discountTotal,
      fixture.deliveryFee,
      total,
      couponCode,
      JSON.stringify(fixture.promo || {}),
      fixture.notes,
      fixture.payment?.midtransToken || null,
      fixture.payment?.midtransOrderId || null,
      createdAt,
      createdAt,
    ],
  });

  // 2. Insert Status History Sequence
  const sequence = ["pending", "processing", "shipped", "delivered", "completed"];
  const currentIdx = sequence.indexOf(fixture.status);
  const historyLimit = currentIdx === -1 ? 1 : currentIdx + 1;
  const baseDate = new Date(createdAt).getTime();

  for (let i = 0; i < historyLimit; i++) {
    const status = fixture.status === "cancelled" && i === 1 ? "cancelled" : sequence[i] || fixture.status;
    await db.execute({
      sql: `INSERT INTO order_status_history (id, tenant_id, order_id, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        tenantId,
        orderId,
        status,
        `Seeded status: ${status}`,
        new Date(baseDate + i * 3600000).toISOString(),
      ],
    });
    if (fixture.status === "cancelled" && i === 1) break;
  }

  // 3. Insert Inventory Movements (Out)
  for (const item of items) {
    await db.execute({
      sql: `INSERT INTO inventory_movements (id, tenant_id, product_id, type, qty, notes, order_id, ref_order_no, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        tenantId,
        item.product_id,
        "out",
        item.qty,
        `Order ${fixture.orderNo}`,
        orderId,
        fixture.orderNo,
        createdAt,
      ],
    });
  }

  // 4. Insert Shipment if relevant
  if (["shipped", "delivered", "completed"].includes(fixture.status)) {
    const isDelivered = ["delivered", "completed"].includes(fixture.status);
    await db.execute({
      sql: `INSERT INTO shipments (id, tenant_id, order_id, order_no, status, carrier, tracking_no, shipped_at, delivered_at, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        tenantId,
        orderId,
        fixture.orderNo,
        isDelivered ? "delivered" : "shipped",
        "J&T Express",
        `JT-${fixture.orderNo}`,
        createdAt,
        isDelivered ? createdAt : null,
        "Auto-seeded shipment",
        createdAt,
        createdAt,
      ],
    });
  }

  // 5. Insert Invoice if paid
  if (fixture.paymentStatus === "paid" || fixture.status === "completed") {
    await db.execute({
      sql: `INSERT INTO invoices (id, tenant_id, order_id, invoice_no, status, issued_at, due_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        tenantId,
        orderId,
        `INV-${fixture.orderNo}`,
        "paid",
        createdAt,
        createdAt,
        createdAt,
        createdAt,
      ],
    });
  }
}

async function ensureRefunds(db: Client, tenantId: string, orderMap: Record<string, { id: string; orderNo: string }>) {
  for (const fixture of refundFixtures) {
    const order = orderMap[fixture.orderNo];
    if (!order) continue;
    // Idempotent: skip if refund for this order already exists
    const exists = await db.execute({
      sql: "SELECT id FROM refunds WHERE order_no = ? AND tenant_id = ?",
      args: [fixture.orderNo, tenantId],
    });
    if (exists.rows.length > 0) continue;
    await db.execute({
      sql: `INSERT INTO refunds (id, tenant_id, order_id, order_no, amount, reason, status, provider_status, provider_response_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        tenantId,
        order.id,
        fixture.orderNo,
        fixture.amount,
        fixture.reason,
        fixture.status,
        fixture.providerStatus,
        JSON.stringify({ reason: fixture.reason }),
        isoDaysAgo(fixture.createdOffset),
        isoDaysAgo(fixture.createdOffset),
      ],
    });
  }
}

async function ensureNotifications(db: Client, tenantId: string) {
  // Bulk-generate 2-3 notifications per order, idempotent per orderNo
  const allOrders = await db.execute({
    sql: "SELECT id, order_no, customer_phone, customer_email, status, payment_status FROM orders WHERE tenant_id = ?",
    args: [tenantId]
  });

  for (const row of allOrders.rows) {
    const r = row as unknown as { id: string; order_no: string; customer_phone: string; customer_email: string; status: string; payment_status: string };
    const orderNo = r.order_no;
    const customerPhone = r.customer_phone;
    const customerEmail = r.customer_email;
    const orderStatus = r.status;
    const paymentStatus = r.payment_status;
    if (!orderNo) continue;

    // Skip if already has notifications for this order
    const existingRes = await db.execute({
      sql: "SELECT COUNT(*) as count FROM notifications WHERE payload_json LIKE ? AND tenant_id = ?",
      args: [`%"orderNo":"${orderNo}"%`, tenantId],
    });
    if (Number((existingRes.rows[0] as { count?: number } | undefined)?.count || 0) > 0) continue;

    const createdAt = isoDaysAgo(1);

    // Always: WhatsApp order confirmation
    if (customerPhone) {
      await db.execute({
        sql: `INSERT INTO notifications (id, tenant_id, channel, recipient, template, payload_json, status, created_at, sent_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          crypto.randomUUID(),
          tenantId,
          "whatsapp",
          customerPhone,
          "order-confirmation",
          JSON.stringify({ orderNo }),
          "sent",
          createdAt,
          createdAt,
          createdAt,
        ],
      });
    }

    // Paid orders: email payment received
    if (customerEmail && ["paid", "refunded"].includes(paymentStatus)) {
      await db.execute({
        sql: `INSERT INTO notifications (id, tenant_id, channel, recipient, template, payload_json, status, created_at, sent_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          crypto.randomUUID(),
          tenantId,
          "email",
          customerEmail,
          "payment-received",
          JSON.stringify({ orderNo }),
          "sent",
          createdAt,
          createdAt,
          createdAt,
        ],
      });
    }

    // Shipped/delivered: WhatsApp tracking update
    if (customerPhone && ["shipped", "delivered", "completed"].includes(orderStatus)) {
      await db.execute({
        sql: `INSERT INTO notifications (id, tenant_id, channel, recipient, template, payload_json, status, created_at, sent_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          crypto.randomUUID(),
          tenantId,
          "whatsapp",
          customerPhone,
          "order-shipped",
          JSON.stringify({ orderNo }),
          "sent",
          createdAt,
          createdAt,
          createdAt,
        ],
      });
    }
  }
}

async function ensureCouponUsages(
  db: Client,
  tenantId: string,
  couponMap: Record<string, { id: string }>,
) {
  // Scan ALL orders with a coupon_code and create usage record if missing
  const ordersWithCoupons = await db.execute({
    sql: "SELECT id, order_no, coupon_code, customer_phone FROM orders WHERE coupon_code IS NOT NULL AND tenant_id = ?",
    args: [tenantId]
  });

  for (const row of ordersWithCoupons.rows) {
    const r = row as unknown as { id: string; order_no: string; coupon_code: string; customer_phone: string };
    const orderId = r.id;
    const couponCode = r.coupon_code;
    const customerPhone = r.customer_phone;
    if (!orderId || !couponCode) continue;

    const existing = await db.execute({
      sql: "SELECT COUNT(*) as count FROM coupon_usages WHERE order_id = ? AND tenant_id = ?",
      args: [orderId, tenantId],
    });
    if (Number((existing.rows[0] as { count?: number } | undefined)?.count || 0) > 0) continue;

    const coupon = couponMap[couponCode];
    if (!coupon) continue;

    await db.execute({
      sql: `INSERT INTO coupon_usages (id, tenant_id, coupon_id, order_id, customer_phone, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), tenantId, coupon.id, orderId, customerPhone, nowIso()],
    });
  }
}

async function ensureAuditLogs(
  db: Client,
  tenantId: string,
  now: string,
  adminEmail: string,
  orderMap: Record<string, { id: string }>,
  productMap: Record<string, { id: string }>,
) {
  const count = await db.execute({
    sql: "SELECT COUNT(*) as count FROM audit_logs WHERE tenant_id = ?",
    args: [tenantId]
  });
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;
  const references = [
    {
      entity: "order",
      id: orderMap["RS-20260226-001"]?.id,
      note: "Sample order entry",
    },
    {
      entity: "product",
      id: productMap["roti-coklat-sholawat"]?.id,
      note: "Seed product",
    },
  ];
  for (const ref of references) {
    if (!ref.id) continue;
    await db.execute({
      sql: `INSERT INTO audit_logs (id, tenant_id, actor_email, action, entity_type, entity_id, data_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), tenantId, adminEmail, "seed", ref.entity, ref.id, JSON.stringify({ note: ref.note }), now],
    });
  }
}

async function buildProductMap(db: Client, tenantId: string) {
  const result = await db.execute({
    sql: "SELECT id, slug, price, name FROM products WHERE tenant_id = ?",
    args: [tenantId]
  });
  const map: Record<string, { id: string; price: number; slug: string; name: string }> = {};
  for (const row of result.rows) {
    const r = row as unknown as { id: string; slug: string; price: number; name: string };
    map[r.slug] = {
      id: r.id,
      price: r.price,
      slug: r.slug,
      name: r.name,
    };
  }
  return map;
}

async function buildCouponMap(db: Client, tenantId: string) {
  const result = await db.execute({
    sql: "SELECT id, code, type, value, max_discount FROM coupons WHERE tenant_id = ?",
    args: [tenantId]
  });
  const map: Record<string, { id: string; type: string; value: number; max_discount: number | null }> = {};
  for (const row of result.rows) {
    const r = row as unknown as { id: string; code: string; type: string; value: number; max_discount: number | null };
    map[r.code] = {
      id: r.id,
      type: r.type,
      value: r.value,
      max_discount: r.max_discount,
    };
  }
  return map;
}

async function buildOrderMap(db: Client, tenantId: string) {
  const result = await db.execute({
    sql: "SELECT id, order_no, created_at, customer_email, customer_phone FROM orders WHERE tenant_id = ?",
    args: [tenantId]
  });
  const map: Record<string, { id: string; orderNo: string; createdAt: string; customerEmail: string; customerPhone: string }> = {};
  for (const row of result.rows) {
    const r = row as unknown as { id: string; order_no: string; created_at: string; customer_email: string; customer_phone: string };
    map[r.order_no] = {
      id: r.id,
      orderNo: r.order_no,
      createdAt: r.created_at,
      customerEmail: r.customer_email || "",
      customerPhone: r.customer_phone || "",
    };
  }
  return map;
}

async function buildCustomerMap(db: Client, tenantId: string) {
  const result = await db.execute({
    sql: "SELECT id, phone FROM customers WHERE tenant_id = ?",
    args: [tenantId]
  });
  const map: Record<string, string> = {};
  for (const row of result.rows) {
    const r = row as unknown as { id: string; phone: string };
    map[r.phone] = r.id;
  }
  return map;
}
