import type { APIContext } from "astro";
import { requireAdmin, verifyCsrf } from "../../../../lib/auth";
import { getDb, initDb } from "../../../../lib/db";
import { nowIso } from "../../../../lib/utils";
import { logAudit } from "../../../../lib/admin";

export async function POST(ctx: APIContext) {
    await initDb(ctx);
    const admin = await requireAdmin(ctx);
    if (!admin) return new Response("Unauthorized", { status: 401 });
    const body = (await ctx.request.json()) as any;
    if (!verifyCsrf(ctx, body)) {
        return new Response("CSRF token tidak valid", { status: 403 });
    }
    const id = String(body.id || "");
    if (!id) return new Response("ID tidak valid", { status: 400 });
    const db = getDb(ctx);
    await db.execute({
        sql: "UPDATE notifications SET status = ?, sent_at = ?, updated_at = ? WHERE id = ?",
        args: ["sent", nowIso(), nowIso(), id],
    });
    await logAudit(ctx, "send", "notification", id);
    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
