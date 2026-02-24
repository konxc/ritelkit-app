import type { APIContext } from "astro";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../../lib/auth";
import { getDb, initDb } from "../../../../lib/db";
import { readBody, json } from "../../../../lib/api";
import { nowIso, slugify, asInt } from "../../../../lib/utils";

export async function PUT(ctx: APIContext) {
    await initDb(ctx);
    const admin = await requireAdmin(ctx);
    if (!admin) return new Response("Unauthorized", { status: 401 });
    const id = ctx.params.id;
    if (!id) return new Response("ID tidak valid", { status: 400 });
    const body = (await readBody(ctx)) as any;
    if (!verifyCsrf(ctx, body)) {
        return new Response("CSRF token tidak valid", { status: 403 });
    }
    const name = sanitizeText(String(body.name || ""));
    const slug = slugify(String(body.slug || name));
    if (!name || !slug) return new Response("Nama kategori wajib", { status: 400 });
    const db = getDb(ctx);
    await db.execute({
        sql: `UPDATE categories
              SET name = ?, slug = ?, sort_order = ?, is_active = ?, updated_at = ?
              WHERE id = ?`,
        args: [
            name,
            slug,
            asInt(body.sort_order, 0),
            body.is_active === "false" ? 0 : 1,
            nowIso(),
            id,
        ],
    });
    return json({ ok: true });
}

export async function DELETE(ctx: APIContext) {
    await initDb(ctx);
    const admin = await requireAdmin(ctx);
    if (!admin) return new Response("Unauthorized", { status: 401 });
    if (!verifyCsrf(ctx)) {
        return new Response("CSRF token tidak valid", { status: 403 });
    }
    const id = ctx.params.id;
    if (!id) return new Response("ID tidak valid", { status: 400 });
    const db = getDb(ctx);
    await db.execute({ sql: "DELETE FROM categories WHERE id = ?", args: [id] });
    return json({ ok: true });
}
