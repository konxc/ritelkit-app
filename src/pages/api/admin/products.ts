import type { APIContext } from "astro";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";
import { readBody, json } from "../../../lib/api";
import { nowIso, slugify, asInt } from "../../../lib/utils";

export async function GET(ctx: APIContext) {
    await initDb(ctx);
    const admin = await requireAdmin(ctx);
    if (!admin) return new Response("Unauthorized", { status: 401 });
    const db = getDb(ctx);
    const result = await db.execute(
        `SELECT p.*, c.name as category_name
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         ORDER BY p.created_at DESC`
    );
    return json({ items: result.rows });
}

export async function POST(ctx: APIContext) {
    await initDb(ctx);
    const admin = await requireAdmin(ctx);
    if (!admin) return new Response("Unauthorized", { status: 401 });
    const body = (await readBody(ctx)) as any;
    if (!verifyCsrf(ctx, body)) {
        return new Response("CSRF token tidak valid", { status: 403 });
    }
    const name = sanitizeText(String(body.name || ""));
    const slug = slugify(String(body.slug || name));
    if (!name || !slug) return new Response("Nama produk wajib", { status: 400 });
    const now = nowIso();
    const db = getDb(ctx);
    let images: string[] | null = null;
    if (body.images_json) {
        try {
            images = JSON.parse(String(body.images_json));
        } catch {
            images = null;
        }
    } else if (body.image_urls) {
        images = String(body.image_urls)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (Array.isArray(images) && images.length === 0) {
        images = null;
    }
    const isActive = body.is_active === "false" ? 0 : 1;
    if (isActive === 1 && (!images || images.length === 0)) {
        return new Response("Produk aktif wajib memiliki minimal 1 gambar", {
            status: 400,
        });
    }

    await db.execute({
        sql: `INSERT INTO products
            (id, sku, name, slug, description, category_id, price, cost, stock, is_active, images_json, metadata_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            crypto.randomUUID(),
            sanitizeText(String(body.sku || "")) || null,
            name,
            slug,
            sanitizeText(String(body.description || "")) || null,
            body.category_id || null,
            asInt(body.price, 0),
            body.cost ? asInt(body.cost, 0) : null,
            body.stock ? asInt(body.stock, 0) : null,
            isActive,
            images ? JSON.stringify(images) : null,
            body.metadata_json ? JSON.stringify(body.metadata_json) : null,
            now,
            now,
        ],
    });
    return json({ ok: true });
}
