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
        "SELECT * FROM categories ORDER BY sort_order ASC, name ASC"
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
    if (!name || !slug) return new Response("Nama kategori wajib", { status: 400 });
    const now = nowIso();
    const db = getDb(ctx);
    await db.execute({
        sql: `INSERT INTO categories (id, name, slug, sort_order, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
            crypto.randomUUID(),
            name,
            slug,
            asInt(body.sort_order, 0),
            body.is_active === "false" ? 0 : 1,
            now,
            now,
        ],
    });
    return json({ ok: true });
}
