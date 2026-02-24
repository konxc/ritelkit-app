import type { APIContext } from "astro";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";
import { readBody, json } from "../../../lib/api";
import { nowIso, asInt } from "../../../lib/utils";

export async function GET(ctx: APIContext) {
    await initDb(ctx);
    const admin = await requireAdmin(ctx);
    if (!admin) return new Response("Unauthorized", { status: 401 });
    const db = getDb(ctx);
    const result = await db.execute(
        "SELECT * FROM coupons ORDER BY created_at DESC"
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
    const code = sanitizeText(String(body.code || "")).toUpperCase();
    const type = sanitizeText(String(body.type || ""));
    if (!code || !type) {
        return new Response("Kode kupon dan tipe wajib diisi", {
            status: 400,
        });
    }
    const now = nowIso();
    const db = getDb(ctx);
    await db.execute({
        sql: `INSERT INTO coupons
            (id, code, type, value, min_order, max_discount, start_at, end_at, usage_limit, per_user_limit, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            crypto.randomUUID(),
            code,
            type,
            asInt(body.value, 0),
            body.min_order ? asInt(body.min_order, 0) : null,
            body.max_discount ? asInt(body.max_discount, 0) : null,
            body.start_at || null,
            body.end_at || null,
            body.usage_limit ? asInt(body.usage_limit, 0) : null,
            body.per_user_limit ? asInt(body.per_user_limit, 0) : null,
            body.is_active === "false" ? 0 : 1,
            now,
            now,
        ],
    });
    return json({ ok: true });
}
