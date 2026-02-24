import type { APIContext } from "astro";
import { requireAdmin, normalizeEmail, sanitizeText, verifyCsrf } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";
import { nowIso } from "../../../lib/utils";
import { hashPassword } from "../../../lib/auth";
import { logAudit } from "../../../lib/admin";

export async function POST(ctx: APIContext) {
    await initDb(ctx);
    const admin = await requireAdmin(ctx);
    if (!admin) return new Response("Unauthorized", { status: 401 });
    const body = Object.fromEntries(await ctx.request.formData());
    if (!verifyCsrf(ctx, body)) {
        return new Response("CSRF token tidak valid", { status: 403 });
    }
    const email = normalizeEmail(String((body as any).email || ""));
    const password = sanitizeText(String((body as any).password || ""));
    const role = sanitizeText(String((body as any).role || "admin"));
    if (!email || password.length < 8) {
        return new Response("Email/password tidak valid", { status: 400 });
    }
    const db = getDb(ctx);
    const hash = await hashPassword(password);
    const id = crypto.randomUUID();
    await db.execute({
        sql: "INSERT INTO admin_users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
        args: [id, email, hash, role, nowIso()],
    });
    await logAudit(ctx, "create", "admin_user", id, { email, role });
    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
