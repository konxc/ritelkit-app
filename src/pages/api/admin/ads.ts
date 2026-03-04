import type { APIContext } from "astro";
import { logAudit } from "../../../lib/admin";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";
import { asInt, nowIso } from "../../../lib/utils";

export async function POST(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const body = Object.fromEntries(await ctx.request.formData());
  if (!verifyCsrf(ctx, body)) {
    return new Response("CSRF token tidak valid", { status: 403 });
  }
  const name = sanitizeText(String(body.name || ""));
  const channel = sanitizeText(String(body.channel || ""));
  const budget = asInt(body.budget, 0);
  const status = sanitizeText(String(body.status || "draft"));
  const startAt = sanitizeText(String(body.start_at || ""));
  const endAt = sanitizeText(String(body.end_at || ""));
  const notes = sanitizeText(String(body.notes || ""));
  if (!name || !channel || budget <= 0) {
    return new Response("Nama, channel, dan budget wajib diisi", {
      status: 400,
    });
  }
  const now = nowIso();
  const db = getDb(ctx);
  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO ads_campaigns (id, name, channel, budget, spend, status, start_at, end_at, notes, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, name, channel, budget, 0, status, startAt || null, endAt || null, notes || null, now, now],
  });
  await logAudit(ctx, "create", "ads_campaign", id, { name, channel, budget });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
