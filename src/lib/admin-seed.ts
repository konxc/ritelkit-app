import type { Client } from "@libsql/client";
import { nowIso } from "./utils";

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
  email: string;
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

type OrderFixture = {
  order_no: string;
  status: string;
  payment_status: string;
  customer_phone: string;
  customer_name: string;
  customer_email: string;
  coupon_code: string | null;
  delivery_fee: number;
  notes: string;
  shipping: {
    province: string;
    city: string;
    district: string;
    street: string;
  };
  items: { slug: string; qty: number }[];
  createdOffset: number;
  promo: Record<string, unknown>;
  payment: { midtrans_token?: string; midtrans_order_id?: string };
};

type ShipmentFixture = {
  order_no: string;
  status: string;
  carrier: string;
  tracking_no: string;
  shippedOffset: number | null;
  deliveredOffset: number | null;
  notes: string;
};

type RefundFixture = {
  order_no: string;
  amount: number;
  reason: string;
  status: string;
  provider_status: string;
  createdOffset: number;
};

type InvoiceFixture = {
  order_no: string;
  invoice_no: string;
  status: string;
  issuedOffset: number;
  dueOffset: number;
};

type InventoryFixture = {
  productSlug: string;
  type: "in" | "out" | "adjustment";
  qty: number;
  notes: string;
  refOrder?: string;
  daysAgo: number;
};

type NotificationFixture = {
  channel: string;
  recipientField: "customer_email" | "customer_phone";
  order_no: string;
  template: string;
  status: string;
  sentOffset: number | null;
};

type CouponUsageFixture = {
  coupon_code: string;
  order_no: string;
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
    productSlug: "roti-keju-sholawat",
    customerName: "Andi Wijaya",
    rating: 5,
    comment: "Kejunya melimpah premium bukan kaleng-kaleng.",
    daysAgo: 10,
  },
  {
    productSlug: "roti-tawar-premium",
    customerName: "Dewi Lestari",
    rating: 5,
    comment: "Teksturnya empuk banget, anak saya suka buat bekal sekolah.",
    daysAgo: 1,
  },
];

const sampleAdmins: SampleAdminUser[] = [
  { email: "admin@konxc.space", role: "owner" },
  { email: "staff@konxc.space", role: "staff" },
  { email: "editor@konxc.space", role: "editor" },
];

const orderFixtures: OrderFixture[] = [
  {
    order_no: "RS-20260226-001",
    status: "processing",
    payment_status: "paid",
    customer_phone: "081234567890",
    customer_name: "Budi Santoso",
    customer_email: "budi@konxc.space",
    coupon_code: "HEMAT10",
    delivery_fee: 15000,
    notes: "Tolong kirim sebelum jam 10 pagi.",
    shipping: {
      province: "DI Yogyakarta",
      city: "Sleman",
      district: "Mlati",
      street: "Jl. Magelang KM 5",
    },
    items: [
      { slug: "roti-coklat-sholawat", qty: 5 },
      { slug: "roti-keju-sholawat", qty: 5 },
    ],
    createdOffset: 0,
    promo: { channel: "google-ads" },
    payment: { midtrans_token: "tok_123", midtrans_order_id: "MT-RS-001" },
  },
  {
    order_no: "RS-20260225-002",
    status: "delivered",
    payment_status: "paid",
    customer_phone: "081987654321",
    customer_name: "Siti Aminah",
    customer_email: "siti@gmail.com",
    coupon_code: null,
    delivery_fee: 0,
    notes: "Paket Snack Box untuk masjid.",
    shipping: {
      province: "DI Yogyakarta",
      city: "Yogyakarta",
      district: "Gondokusuman",
      street: "Jl. Solo No. 12",
    },
    items: [{ slug: "snack-box-syukur", qty: 50 }],
    createdOffset: 1,
    promo: { channel: "facebook" },
    payment: { midtrans_token: "tok_456", midtrans_order_id: "MT-RS-002" },
  },
  {
    order_no: "RS-20260224-003",
    status: "pending",
    payment_status: "unpaid",
    customer_phone: "085566778899",
    customer_name: "Andi Wijaya",
    customer_email: "andi.w@perusahaan.co.id",
    coupon_code: null,
    delivery_fee: 25000,
    notes: "Pesanan kantor, lampirkan nota fisik.",
    shipping: {
      province: "Jawa Tengah",
      city: "Solo",
      district: "Laweyan",
      street: "Jl. Slamet Riyadi 100",
    },
    items: [
      { slug: "roti-tawar-premium", qty: 10 },
      { slug: "roti-coklat-sholawat", qty: 20 },
    ],
    createdOffset: 2,
    promo: { channel: "direct" },
    payment: {},
  },
  {
    order_no: "RS-20260220-004",
    status: "cancelled",
    payment_status: "failed",
    customer_phone: "087711223344",
    customer_name: "Dewi Lestari",
    customer_email: "dewi.lestari@test.com",
    coupon_code: null,
    delivery_fee: 10000,
    notes: "Salah klik jumlah.",
    shipping: {
      province: "DI Yogyakarta",
      city: "Bantul",
      district: "Kasihan",
      street: "Jl. Ringroad Selatan",
    },
    items: [{ slug: "donasi-10-roti", qty: 1 }],
    createdOffset: 6,
    promo: { channel: "instagram" },
    payment: {},
  },
];

const shipmentFixtures: ShipmentFixture[] = [
  {
    order_no: "RS-20260226-001",
    status: "packing",
    carrier: "SiCepat",
    tracking_no: "SIG-RS-001",
    shippedOffset: 0,
    deliveredOffset: null,
    notes: "Barang sedang disiapkan.",
  },
  {
    order_no: "RS-20260225-002",
    status: "shipped",
    carrier: "GrabExpress",
    tracking_no: "GRB-RS-002",
    shippedOffset: 1,
    deliveredOffset: 0,
    notes: "Sudah sampai di lokasi.",
  },
];

const refundFixtures: RefundFixture[] = [
  {
    order_no: "RS-20260220-004",
    amount: 110000,
    reason: "Double order / Salah input",
    status: "completed",
    provider_status: "refunded",
    createdOffset: 5,
  },
];

const invoiceFixtures: InvoiceFixture[] = [
  {
    order_no: "RS-20260226-001",
    invoice_no: "INV-20260226-001",
    status: "paid",
    issuedOffset: 0,
    dueOffset: -1,
  },
  {
    order_no: "RS-20260225-002",
    invoice_no: "INV-20260225-002",
    status: "paid",
    issuedOffset: 1,
    dueOffset: -6,
  },
];

const inventoryFixtures: InventoryFixture[] = [
  {
    productSlug: "roti-coklat-sholawat",
    type: "in",
    qty: 200,
    notes: "Stok awal produksi",
    daysAgo: 10,
  },
  {
    productSlug: "roti-keju-sholawat",
    type: "in",
    qty: 150,
    notes: "Restock keju premium",
    daysAgo: 8,
  },
  {
    productSlug: "roti-coklat-sholawat",
    type: "out",
    qty: 5,
    notes: "Order RS-20260226-001",
    refOrder: "RS-20260226-001",
    daysAgo: 0,
  },
  {
    productSlug: "snack-box-syukur",
    type: "out",
    qty: 50,
    notes: "Order RS-20260225-002",
    refOrder: "RS-20260225-002",
    daysAgo: 1,
  },
];

const notificationFixtures: NotificationFixture[] = [
  {
    channel: "whatsapp",
    recipientField: "customer_phone",
    order_no: "RS-20260226-001",
    template: "order-confirmation",
    status: "sent",
    sentOffset: 0,
  },
  {
    channel: "email",
    recipientField: "customer_email",
    order_no: "RS-20260225-002",
    template: "order-shipped",
    status: "sent",
    sentOffset: 1,
  },
];

const couponUsageFixtures: CouponUsageFixture[] = [
  {
    coupon_code: "HEMAT10",
    order_no: "RS-20260226-001",
  },
];

type SeedOptions = {
  adminEmail: string;
  now?: string;
};

export async function seedAdminData(db: Client, options: SeedOptions) {
  const now = options.now ?? nowIso();
  await ensureAdminUsers(db, now);
  await ensureCategories(db, now);
  const categoryMap = await buildCategoryMap(db);
  await ensureProducts(db, now, categoryMap);
  const productMap = await buildProductMap(db);
  await ensureProductReviews(db, productMap);
  await ensureCoupons(db, now);
  const couponMap = await buildCouponMap(db);
  await ensureCustomers(db);
  await ensureSettings(db, now);
  await ensureAds(db, now);
  await ensureCmsPages(db, now);
  await ensureShippingRules(db, now);
  await ensureOrders(db, couponMap, productMap);
  const orderMap = await buildOrderMap(db);
  await ensureShipments(db, orderMap, now);
  await ensureRefunds(db, orderMap);
  await ensureInvoices(db, orderMap);
  await ensureOrderStatusHistory(db, orderMap);
  await ensureInventoryMovements(db, productMap);
  await ensureCouponUsages(db, now, orderMap, couponMap);
  await ensureNotifications(db, now, orderMap);
  await ensureAuditLogs(db, now, options.adminEmail, orderMap, productMap);
}

async function ensureAdminUsers(db: Client, now: string) {
  const count = await db.execute("SELECT COUNT(*) as count FROM admin_users");
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 1) return; // Allow 1 default admin
  for (const admin of sampleAdmins) {
    // Skip if already exists
    const exists = await db.execute({
      sql: "SELECT email FROM admin_users WHERE email = ?",
      args: [admin.email],
    });
    if (exists.rows.length > 0) continue;

    await db.execute({
      sql: "INSERT INTO admin_users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [
        crypto.randomUUID(),
        admin.email,
        "120000:salt:hash", // placeholder, real login needs hashPassword
        admin.role,
        now,
      ],
    });
  }
}

async function ensureCategories(db: Client, now: string) {
  for (const category of sampleCategories) {
    const exists = await db.execute({
      sql: "SELECT id FROM categories WHERE slug = ?",
      args: [category.slug],
    });
    if (exists.rows.length > 0) continue;
    await db.execute({
      sql: "INSERT INTO categories (id, name, slug, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [crypto.randomUUID(), category.name, category.slug, 0, 1, now, now],
    });
  }
}

async function ensureProducts(db: Client, now: string, categoryMap: Record<string, string>) {
  for (const product of sampleProducts) {
    const exists = await db.execute({
      sql: "SELECT id FROM products WHERE slug = ?",
      args: [product.slug],
    });
    if (exists.rows.length > 0) continue;
    const categoryId = categoryMap[product.categorySlug] || null;
    await db.execute({
      sql: `INSERT INTO products (id, sku, name, slug, description, category_id, price, cost, stock, is_active, images_json, metadata_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
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

async function ensureProductReviews(db: Client, productMap: Record<string, { id: string }>) {
  const count = await db.execute("SELECT COUNT(*) as count FROM product_reviews");
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;
  for (const review of sampleReviews) {
    const product = productMap[review.productSlug];
    if (!product) continue;
    await db.execute({
      sql: `INSERT INTO product_reviews (id, product_id, customer_name, rating, comment, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
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

async function ensureCoupons(db: Client, now: string) {
  for (const coupon of sampleCoupons) {
    const exists = await db.execute({
      sql: "SELECT id FROM coupons WHERE code = ?",
      args: [coupon.code],
    });
    if (exists.rows.length > 0) continue;
    await db.execute({
      sql: `INSERT INTO coupons (id, code, type, value, min_order, max_discount, start_at, end_at, usage_limit, per_user_limit, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
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

async function ensureCustomers(db: Client) {
  for (const customer of sampleCustomers) {
    const exists = await db.execute({
      sql: "SELECT id FROM customers WHERE phone = ?",
      args: [customer.phone],
    });
    if (exists.rows.length > 0) continue;
    await db.execute({
      sql: `INSERT INTO customers (id, name, email, phone, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
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

async function ensureSettings(db: Client, now: string) {
  const count = await db.execute("SELECT COUNT(*) as count FROM settings");
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;
  await db.execute({
    sql: "INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)",
    args: [
      "order_settings",
      JSON.stringify({
        preorder_only: false,
        same_day_enabled: true,
        minimum_lead_time_hours: 2,
      }),
      now,
    ],
  });
  await db.execute({
    sql: "INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)",
    args: [
      "delivery_settings",
      JSON.stringify({
        delivery_province: "DI Yogyakarta",
        free_delivery_threshold: 150000,
      }),
      now,
    ],
  });
}

async function ensureAds(db: Client, now: string) {
  for (const ad of sampleAds) {
    const exists = await db.execute({
      sql: "SELECT id FROM ads_campaigns WHERE name = ?",
      args: [ad.name],
    });
    if (exists.rows.length > 0) continue;
    await db.execute({
      sql: `INSERT INTO ads_campaigns (id, name, channel, budget, spend, status, start_at, end_at, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
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

async function ensureCmsPages(db: Client, now: string) {
  for (const page of sampleCmsPages) {
    const exists = await db.execute({
      sql: "SELECT id FROM cms_pages WHERE slug = ?",
      args: [page.slug],
    });
    if (exists.rows.length > 0) continue;
    await db.execute({
      sql: `INSERT INTO cms_pages (id, slug, title, content_md, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), page.slug, page.title, page.content, 1, now, now],
    });
  }
}

async function ensureShippingRules(db: Client, now: string) {
  const count = await db.execute("SELECT COUNT(*) as count FROM shipping_rules");
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;
  for (const rule of sampleShippingRules) {
    await db.execute({
      sql: `INSERT INTO shipping_rules (id, name, type, priority, is_active, config_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
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
  couponMap: Record<
    string,
    { id: string; type: string; value: number; max_discount: number | null }
  >,
  productMap: Record<string, { id: string; price: number; slug: string; name: string }>,
) {
  const count = await db.execute("SELECT COUNT(*) as count FROM orders");
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 5) return; // Already seeded enough

  // 1. Insert fixed fixtures
  for (const fixture of orderFixtures) {
    await insertOrderFixture(db, fixture, couponMap, productMap);
  }

  // 2. Generate random historical orders for dashboard charts (~50 orders)
  const productSlugs = Object.keys(productMap);
  const statuses = ["pending", "processing", "shipped", "delivered", "completed", "cancelled"];
  const paymentStatuses = ["unpaid", "paid", "paid", "paid", "failed"]; // Bias towards paid
  const customers = sampleCustomers;
  const cities = ["Jakarta", "Surabaya", "Solo", "Bandung", "Semarang", "Yogya"];

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 90); // 0-90 days ago
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const pStatus =
      status === "cancelled"
        ? "unpaid"
        : paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];

    const randomItems = [];
    const itemNum = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < itemNum; j++) {
      randomItems.push({
        slug: productSlugs[Math.floor(Math.random() * productSlugs.length)],
        qty: Math.floor(Math.random() * 3) + 1,
      });
    }

    const fixture: OrderFixture = {
      order_no: `RS-RAND-${1000 + i}`,
      status: status,
      payment_status: pStatus,
      customer_phone: customer.phone,
      customer_name: customer.name,
      customer_email: customer.email,
      coupon_code: Math.random() > 0.7 ? "HEMAT10" : null,
      delivery_fee: city === "Yogya" ? 0 : 15000 + Math.floor(Math.random() * 20000),
      notes: "Auto-generated for demo",
      shipping: {
        province: city === "Yogya" ? "DI Yogyakarta" : "Luar DIY",
        city: city,
        district: "Kecamatan",
        street: `Jl. Demangan Baru No. ${i + 1}`,
      },
      items: randomItems,
      createdOffset: daysAgo,
      promo: { channel: "demo-auto" },
      payment: {},
    };
    await insertOrderFixture(db, fixture, couponMap, productMap);
  }
}

async function insertOrderFixture(
  db: Client,
  fixture: OrderFixture,
  couponMap: Record<
    string,
    { id: string; type: string; value: number; max_discount: number | null }
  >,
  productMap: Record<string, { id: string; price: number; slug: string; name: string }>,
) {
  const items = fixture.items
    .map((item) => {
      const product = productMap[item.slug];
      if (!product) return null;
      return { product_id: product.id, qty: item.qty, price: product.price };
    })
    .filter((item): item is { product_id: string; qty: number; price: number } => Boolean(item));
  if (items.length === 0) return;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  let discountTotal = 0;
  let couponCode = fixture.coupon_code;
  if (couponCode && couponMap[couponCode]) {
    const coupon = couponMap[couponCode];
    if (coupon.type === "percent") {
      const maxDisc = coupon.max_discount ?? Number.MAX_SAFE_INTEGER;
      discountTotal = Math.min(Math.round((subtotal * coupon.value) / 100), maxDisc);
    } else {
      discountTotal = coupon.value;
    }
  } else {
    couponCode = null;
  }
  const total = subtotal - discountTotal + fixture.delivery_fee;
  const shippingPayload = {
    province: fixture.shipping.province,
    city: fixture.shipping.city,
    district: fixture.shipping.district,
    street: fixture.shipping.street,
  };
  const createdAt = isoDaysAgo(fixture.createdOffset);
  await db.execute({
    sql: `INSERT INTO orders (id, order_no, status, payment_status, customer_name, customer_email, customer_phone, shipping_address_json, items_json, subtotal, discount_total, delivery_fee, total, coupon_code, promo_json, notes, midtrans_token, midtrans_order_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(),
      fixture.order_no,
      fixture.status,
      fixture.payment_status,
      fixture.customer_name,
      fixture.customer_email,
      fixture.customer_phone,
      JSON.stringify(shippingPayload),
      JSON.stringify(items),
      subtotal,
      discountTotal,
      fixture.delivery_fee,
      total,
      couponCode,
      JSON.stringify(fixture.promo || {}),
      fixture.notes,
      fixture.payment.midtrans_token || null,
      fixture.payment.midtrans_order_id || null,
      createdAt,
      createdAt,
    ],
  });
}

async function ensureShipments(
  db: Client,
  orderMap: Record<string, { id: string; order_no: string }>,
  now: string,
) {
  const count = await db.execute("SELECT COUNT(*) as count FROM shipments");
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;
  for (const fixture of shipmentFixtures) {
    if (!orderMap[fixture.order_no]) continue;
    const shippedAt = fixture.shippedOffset !== null ? isoDaysAgo(fixture.shippedOffset) : null;
    const deliveredAt =
      fixture.deliveredOffset !== null ? isoDaysAgo(fixture.deliveredOffset) : null;
    await db.execute({
      sql: `INSERT INTO shipments (id, order_no, status, carrier, tracking_no, shipped_at, delivered_at, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        fixture.order_no,
        fixture.status,
        fixture.carrier,
        fixture.tracking_no,
        shippedAt,
        deliveredAt,
        fixture.notes,
        shippedAt || now,
        shippedAt || now,
      ],
    });
  }
}

async function ensureRefunds(
  db: Client,
  orderMap: Record<string, { id: string; order_no: string }>,
) {
  const count = await db.execute("SELECT COUNT(*) as count FROM refunds");
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;
  for (const fixture of refundFixtures) {
    if (!orderMap[fixture.order_no]) continue;
    await db.execute({
      sql: `INSERT INTO refunds (id, order_no, amount, reason, status, provider_status, provider_response_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        fixture.order_no,
        fixture.amount,
        fixture.reason,
        fixture.status,
        fixture.provider_status,
        JSON.stringify({ reason: fixture.reason }),
        isoDaysAgo(fixture.createdOffset),
        isoDaysAgo(fixture.createdOffset),
      ],
    });
  }
}

async function ensureInvoices(
  db: Client,
  orderMap: Record<string, { id: string; order_no: string }>,
) {
  const count = await db.execute("SELECT COUNT(*) as count FROM invoices");
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;
  for (const fixture of invoiceFixtures) {
    const order = orderMap[fixture.order_no];
    if (!order) continue;
    const issuedAt = isoDaysAgo(fixture.issuedOffset);
    const dueAt = isoDaysAgo(fixture.dueOffset);
    await db.execute({
      sql: `INSERT INTO invoices (id, order_id, invoice_no, status, issued_at, due_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        order.id,
        fixture.invoice_no,
        fixture.status,
        issuedAt,
        dueAt,
        issuedAt,
        issuedAt,
      ],
    });
  }
}

async function ensureOrderStatusHistory(
  db: Client,
  orderMap: Record<string, { id: string; order_no: string; created_at: string }>,
) {
  const count = await db.execute("SELECT COUNT(*) as count FROM order_status_history");
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;
  const statusSequences: Record<string, string[]> = {
    "RS-20260226-001": ["pending", "processing"],
    "RS-20260225-002": ["pending", "processing", "shipped", "delivered"],
    "RS-20260224-003": ["pending"],
    "RS-20260220-004": ["pending", "cancelled"],
  };
  for (const [orderNo, statuses] of Object.entries(statusSequences)) {
    const order = orderMap[orderNo];
    if (!order) continue;
    const baseTime = new Date(order.created_at).getTime();
    for (let index = 0; index < statuses.length; index += 1) {
      const status = statuses[index];
      const timestamp = new Date(baseTime + index * 15 * 60 * 1000).toISOString();
      await db.execute({
        sql: `INSERT INTO order_status_history (id, order_id, status, notes, created_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [crypto.randomUUID(), order.id, status, `Status ${status}`, timestamp],
      });
    }
  }
}

async function ensureInventoryMovements(db: Client, productMap: Record<string, { id: string }>) {
  const count = await db.execute("SELECT COUNT(*) as count FROM inventory_movements");
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;
  for (const fixture of inventoryFixtures) {
    const product = productMap[fixture.productSlug];
    if (!product) continue;
    const createdAt = isoDaysAgo(fixture.daysAgo);
    await db.execute({
      sql: `INSERT INTO inventory_movements (id, product_id, type, qty, notes, ref_order_no, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        product.id,
        fixture.type,
        fixture.qty,
        fixture.notes,
        fixture.refOrder ?? null,
        createdAt,
      ],
    });
  }
}

async function ensureNotifications(
  db: Client,
  now: string,
  orderMap: Record<string, { order_no: string; customer_email: string; customer_phone: string }>,
) {
  const count = await db.execute("SELECT COUNT(*) as count FROM notifications");
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;
  for (const fixture of notificationFixtures) {
    const order = orderMap[fixture.order_no];
    if (!order) continue;
    const createdAt = isoDaysAgo(fixture.sentOffset ?? 0);
    const sentAt = fixture.sentOffset !== null ? isoDaysAgo(fixture.sentOffset) : null;
    const recipient =
      fixture.recipientField === "customer_email" ? order.customer_email : order.customer_phone;
    await db.execute({
      sql: `INSERT INTO notifications (id, channel, recipient, template, payload_json, status, created_at, sent_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        fixture.channel,
        recipient,
        fixture.template,
        JSON.stringify({ order_no: fixture.order_no }),
        fixture.status,
        createdAt,
        sentAt,
        sentAt || createdAt || now,
      ],
    });
  }
}

async function ensureCouponUsages(
  db: Client,
  now: string,
  orderMap: Record<string, { id: string; customer_phone: string }>,
  couponMap: Record<string, { id: string }>,
) {
  const count = await db.execute("SELECT COUNT(*) as count FROM coupon_usages");
  if (Number((count.rows[0] as { count?: number } | undefined)?.count || 0) > 0) return;
  for (const fixture of couponUsageFixtures) {
    const order = orderMap[fixture.order_no];
    const coupon = couponMap[fixture.coupon_code];
    if (!order || !coupon) continue;
    await db.execute({
      sql: `INSERT INTO coupon_usages (id, coupon_id, order_id, customer_phone, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), coupon.id, order.id, order.customer_phone, now],
    });
  }
}

async function ensureAuditLogs(
  db: Client,
  now: string,
  adminEmail: string,
  orderMap: Record<string, { id: string }>,
  productMap: Record<string, { id: string }>,
) {
  const count = await db.execute("SELECT COUNT(*) as count FROM audit_logs");
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
      sql: `INSERT INTO audit_logs (id, actor_email, action, entity_type, entity_id, data_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        adminEmail,
        "seed",
        ref.entity,
        ref.id,
        JSON.stringify({ note: ref.note }),
        now,
      ],
    });
  }
}

async function buildCategoryMap(db: Client) {
  const rows = await db.execute("SELECT id, slug FROM categories");
  const map: Record<string, string> = {};
  (rows.rows as Array<Record<string, unknown>>).forEach((row) => {
    if (row.slug) {
      map[String(row.slug)] = String(row.id);
    }
  });
  return map;
}

async function buildProductMap(db: Client) {
  const rows = await db.execute("SELECT id, slug, price, name FROM products");
  const map: Record<string, { id: string; price: number; slug: string; name: string }> = {};
  (rows.rows as Array<Record<string, unknown>>).forEach((row) => {
    if (row.slug) {
      map[String(row.slug)] = {
        id: String(row.id),
        price: Number(row.price || 0),
        slug: String(row.slug),
        name: String(row.name || ""),
      };
    }
  });
  return map;
}

async function buildCouponMap(db: Client) {
  const rows = await db.execute("SELECT id, code, type, value, max_discount FROM coupons");
  const map: Record<
    string,
    { id: string; type: string; value: number; max_discount: number | null }
  > = {};
  (rows.rows as Array<Record<string, unknown>>).forEach((row) => {
    if (row.code) {
      map[String(row.code)] = {
        id: String(row.id),
        type: String(row.type || "percent"),
        value: Number(row.value || 0),
        max_discount: row.max_discount !== null ? Number(row.max_discount) : null,
      };
    }
  });
  return map;
}

async function buildOrderMap(db: Client) {
  const rows = await db.execute(
    "SELECT id, order_no, created_at, customer_email, customer_phone FROM orders",
  );
  const map: Record<
    string,
    {
      id: string;
      order_no: string;
      created_at: string;
      customer_email: string;
      customer_phone: string;
    }
  > = {};
  (rows.rows as Array<Record<string, unknown>>).forEach((row) => {
    if (row.order_no) {
      map[String(row.order_no)] = {
        id: String(row.id),
        order_no: String(row.order_no),
        created_at: String(row.created_at || new Date().toISOString()),
        customer_email: String(row.customer_email || ""),
        customer_phone: String(row.customer_phone || ""),
      };
    }
  });
  return map;
}
