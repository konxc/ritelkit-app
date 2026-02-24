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
        "SELECT * FROM shipping_rules ORDER BY priority ASC, created_at DESC"
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
    const type = sanitizeText(String(body.type || ""));
    if (!name || !type) {
        return new Response("Nama dan tipe rule wajib diisi", { status: 400 });
    }
    if (!["flat", "free_threshold", "zone"].includes(type)) {
        return new Response("Tipe rule tidak valid", { status: 400 });
    }
    const config = body.config ?? {};
    if (type === "flat" && (!config || typeof config.fee !== "number")) {
        return new Response("Config flat fee tidak valid", { status: 400 });
    }
    if (
        type === "free_threshold" &&
        (!config || typeof config.threshold !== "number" || typeof config.fee !== "number")
    ) {
        return new Response("Config threshold tidak valid", { status: 400 });
    }
    if (type === "zone" && (!config || !Array.isArray(config.zones))) {
        return new Response("Config zone tidak valid", { status: 400 });
    }
    const now = nowIso();
    const db = getDb(ctx);
    await db.execute({
        sql: `INSERT INTO shipping_rules
            (id, name, type, priority, is_active, config_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            crypto.randomUUID(),
            name,
            type,
            asInt(body.priority, 100),
            body.is_active === "false" ? 0 : 1,
            JSON.stringify(config),
            now,
            now,
        ],
    });
    return json({ ok: true });
}
