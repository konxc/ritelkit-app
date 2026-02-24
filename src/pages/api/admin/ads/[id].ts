import type { APIContext } from "astro";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../../lib/auth";
import { getDb, initDb } from "../../../../lib/db";
import { nowIso, asInt } from "../../../../lib/utils";
import { logAudit } from "../../../../lib/admin";

export async function PUT(ctx: APIContext) {
    await initDb(ctx);
    const admin = await requireAdmin(ctx);
    if (!admin) return new Response("Unauthorized", { status: 401 });
    const body = (await ctx.request.json()) as any;
    if (!verifyCsrf(ctx, body)) {
        return new Response("CSRF token tidak valid", { status: 403 });
    }
    const id = ctx.params.id || "";
    const name = sanitizeText(String(body.name || ""));
    const channel = sanitizeText(String(body.channel || ""));
    const budget = asInt(body.budget, 0);
    const spend = asInt(body.spend, 0);
    const status = sanitizeText(String(body.status || ""));
    if (!id || !name || !channel) {
        return new Response("Data tidak valid", { status: 400 });
    }
    const db = getDb(ctx);
    await db.execute({
        sql: `UPDATE ads_campaigns SET name = ?, channel = ?, budget = ?, spend = ?, status = ?, updated_at = ? WHERE id = ?`,
        args: [name, channel, budget, spend, status, nowIso(), id],
    });
    await logAudit(ctx, "update", "ads_campaign", id, { name, channel, budget, spend, status });
    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}

export async function DELETE(ctx: APIContext) {
    await initDb(ctx);
    const admin = await requireAdmin(ctx);
    if (!admin) return new Response("Unauthorized", { status: 401 });
    const body =
        ctx.request.headers.get("content-type")?.includes("application/json")
            ? await ctx.request.json()
            : Object.fromEntries(await ctx.request.formData());
    if (!verifyCsrf(ctx, body)) {
        return new Response("CSRF token tidak valid", { status: 403 });
    }
    const id = ctx.params.id || "";
    const db = getDb(ctx);
    await db.execute({ sql: "DELETE FROM ads_campaigns WHERE id = ?", args: [id] });
    await logAudit(ctx, "delete", "ads_campaign", id);
    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
