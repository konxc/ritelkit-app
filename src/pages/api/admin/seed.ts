import type { APIContext } from "astro";
import { requireAdmin, verifyCsrf } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";
import { nowIso } from "../../../lib/utils";

export async function POST(ctx: APIContext) {
    await initDb(ctx);
    const admin = await requireAdmin(ctx);
    if (!admin) return new Response("Unauthorized", { status: 401 });
    const contentType = ctx.request.headers.get("content-type") || "";
    const body =
        contentType.includes("application/json")
            ? await ctx.request.json()
            : contentType.includes("application/x-www-form-urlencoded") ||
                contentType.includes("multipart/form-data")
              ? Object.fromEntries(await ctx.request.formData())
              : {};
    if (!verifyCsrf(ctx, body)) {
        return new Response("CSRF token tidak valid", { status: 403 });
    }
    const db = getDb(ctx);
    const now = nowIso();

    const catCount = await db.execute("SELECT COUNT(*) as count FROM categories");
    if (Number((catCount.rows[0] as any)?.count || 0) === 0) {
        const categories = [
            { id: crypto.randomUUID(), name: "Roti Manis", slug: "roti-manis" },
            { id: crypto.randomUUID(), name: "Roti Tawar", slug: "roti-tawar" },
        ];
        for (const cat of categories) {
            await db.execute({
                sql: "INSERT INTO categories (id, name, slug, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                args: [cat.id, cat.name, cat.slug, 0, 1, now, now],
            });
        }
    }

    const prodCount = await db.execute("SELECT COUNT(*) as count FROM products");
    if (Number((prodCount.rows[0] as any)?.count || 0) === 0) {
        const catRes = await db.execute("SELECT id FROM categories ORDER BY created_at ASC");
        const catId = String((catRes.rows[0] as any)?.id || "");
        const products = [
            {
                name: "Roti Coklat Sholawat",
                slug: "roti-coklat-sholawat",
                price: 12000,
                stock: 50,
            },
            {
                name: "Roti Keju Sholawat",
                slug: "roti-keju-sholawat",
                price: 14000,
                stock: 40,
            },
        ];
        for (const p of products) {
            await db.execute({
                sql: `INSERT INTO products (id, sku, name, slug, description, category_id, price, cost, stock, is_active, images_json, metadata_json, created_at, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    crypto.randomUUID(),
                    null,
                    p.name,
                    p.slug,
                    "Produk demo untuk testing",
                    catId || null,
                    p.price,
                    Math.round(p.price * 0.6),
                    p.stock,
                    1,
                    "[]",
                    "{}",
                    now,
                    now,
                ],
            });
        }
    }

    const couponCount = await db.execute("SELECT COUNT(*) as count FROM coupons");
    if (Number((couponCount.rows[0] as any)?.count || 0) === 0) {
        await db.execute({
            sql: `INSERT INTO coupons (id, code, type, value, min_order, max_discount, start_at, end_at, usage_limit, per_user_limit, is_active, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                crypto.randomUUID(),
                "HEMAT10",
                "percent",
                10,
                50000,
                20000,
                null,
                null,
                100,
                1,
                1,
                now,
                now,
            ],
        });
    }

    const settingsCount = await db.execute("SELECT COUNT(*) as count FROM settings");
    if (Number((settingsCount.rows[0] as any)?.count || 0) === 0) {
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

    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
