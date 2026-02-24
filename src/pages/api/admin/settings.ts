import type { APIContext } from "astro";
import { requireAdmin, verifyCsrf } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";
import { readBody, json } from "../../../lib/api";
import { nowIso } from "../../../lib/utils";

export async function GET(ctx: APIContext) {
    await initDb(ctx);
    const admin = await requireAdmin(ctx);
    if (!admin) return new Response("Unauthorized", { status: 401 });
    const db = getDb(ctx);
    const result = await db.execute("SELECT key, value_json FROM settings");
    const settings: Record<string, unknown> = {};
    for (const row of result.rows) {
        settings[String(row.key)] = JSON.parse(String(row.value_json));
    }
    return json({ settings });
}

export async function POST(ctx: APIContext) {
    await initDb(ctx);
    const admin = await requireAdmin(ctx);
    if (!admin) return new Response("Unauthorized", { status: 401 });
    const body = (await readBody(ctx)) as any;
    if (!verifyCsrf(ctx, body)) {
        return new Response("CSRF token tidak valid", { status: 403 });
    }
    const db = getDb(ctx);
    const now = nowIso();
    for (const [key, value] of Object.entries(body)) {
        await db.execute({
            sql: "INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at",
            args: [key, JSON.stringify(value), now],
        });
    }
    return json({ ok: true });
}
