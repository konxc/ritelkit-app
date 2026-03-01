import type { APIContext } from "astro";
import { logAudit } from "../../../lib/admin";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";
import { nowIso } from "../../../lib/utils";

export async function POST(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });

  const body = Object.fromEntries(await ctx.request.formData());
  if (!verifyCsrf(ctx, body)) {
    return new Response("CSRF token tidak valid", { status: 403 });
  }

  const name = sanitizeText(String(body.name || ""));
  const phone = sanitizeText(String(body.phone || ""));
  const email = sanitizeText(String(body.email || ""));
  const notes = sanitizeText(String(body.notes || ""));
  if (!name || !phone) {
    return new Response("Nama dan telepon wajib diisi", { status: 400 });
  }

  const db = getDb(ctx);
  const now = nowIso();
  const id = crypto.randomUUID();
  await db.execute({
    sql: "INSERT INTO customers (id, name, email, phone, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [id, name, email || null, phone, notes || null, now, now],
  });
  await logAudit(ctx, "create", "customer", id, { name, phone });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
