import { createClient, type Client } from "@libsql/client";
import type { APIContext } from "astro";
import { getEnv } from "./env";

let client: Client | null = null;
let initialized = false;

export function getDb(ctx?: APIContext): Client {
    if (!client) {
        const env = getEnv(ctx);
        client = createClient({
            url: env.DATABASE_URL,
            authToken: env.DATABASE_AUTH_TOKEN,
        });
    }
    return client;
}

export async function initDb(ctx?: APIContext) {
    if (initialized) return;
    const db = getDb(ctx);

    const schema = `
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY,
    ip TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category_id TEXT,
    price INTEGER NOT NULL,
    cost INTEGER,
    stock INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    images_json TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    value INTEGER NOT NULL,
    min_order INTEGER,
    max_discount INTEGER,
    start_at TEXT,
    end_at TEXT,
    usage_limit INTEGER,
    per_user_limit INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    type TEXT NOT NULL,
    qty INTEGER NOT NULL,
    notes TEXT,
    ref_order_no TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    order_no TEXT NOT NULL,
    status TEXT NOT NULL,
    carrier TEXT,
    tracking_no TEXT,
    shipped_at TEXT,
    delivered_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS refunds (
    id TEXT PRIMARY KEY,
    order_no TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT,
    status TEXT NOT NULL,
    provider_status TEXT,
    provider_response_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ads_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    channel TEXT NOT NULL,
    budget INTEGER NOT NULL,
    spend INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    start_at TEXT,
    end_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_pages (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content_md TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    data_json TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    channel TEXT NOT NULL,
    recipient TEXT NOT NULL,
    template TEXT,
    payload_json TEXT,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    sent_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS coupon_usages (
    id TEXT PRIMARY KEY,
    coupon_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    customer_phone TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(coupon_id) REFERENCES coupons(id),
    FOREIGN KEY(order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS shipping_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 100,
    is_active INTEGER NOT NULL DEFAULT 1,
    config_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_no TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT NOT NULL,
    shipping_address_json TEXT NOT NULL,
    items_json TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    discount_total INTEGER NOT NULL,
    delivery_fee INTEGER NOT NULL,
    total INTEGER NOT NULL,
    coupon_code TEXT,
    promo_json TEXT,
    notes TEXT,
    midtrans_token TEXT,
    midtrans_order_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    invoice_no TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    issued_at TEXT NOT NULL,
    due_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS product_reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id)
);
    `;

    const statements = schema
        .split(";")
        .map((statement) => statement.trim())
        .filter(Boolean);
    for (const statement of statements) {
        await db.execute(statement);
    }
    try {
        await db.execute("ALTER TABLE notifications ADD COLUMN updated_at TEXT");
    } catch {
        // ignore if column exists
    }
    try {
        await db.execute("ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'owner'");
    } catch {
        // ignore if column exists
    }
    try {
        await db.execute("ALTER TABLE refunds ADD COLUMN provider_status TEXT");
    } catch {
        // ignore if column exists
    }
    try {
        await db.execute("ALTER TABLE refunds ADD COLUMN provider_response_json TEXT");
    } catch {
        // ignore if column exists
    }
    initialized = true;
}
