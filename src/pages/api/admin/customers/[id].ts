import type { APIContext } from "astro";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../../lib/auth";
import { getDb, initDb } from "../../../../lib/db";
import { nowIso } from "../../../../lib/utils";
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
    const phone = sanitizeText(String(body.phone || ""));
    const email = sanitizeText(String(body.email || ""));
    const notes = sanitizeText(String(body.notes || ""));
    if (!id || !name || !phone) {
        return new Response("Data tidak valid", { status: 400 });
    }
    const db = getDb(ctx);
    await db.execute({
        sql: "UPDATE customers SET name = ?, phone = ?, email = ?, notes = ?, updated_at = ? WHERE id = ?",
        args: [name, phone, email || null, notes || null, nowIso(), id],
    });
    await logAudit(ctx, "update", "customer", id, { name, phone });
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
    await db.execute({ sql: "DELETE FROM customers WHERE id = ?", args: [id] });
    await logAudit(ctx, "delete", "customer", id);
    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
