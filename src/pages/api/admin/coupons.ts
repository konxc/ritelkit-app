import type { APIContext } from "astro";
import { json, readBody } from "../../../lib/api";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";
import { asInt, nowIso } from "../../../lib/utils";

export async function GET(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const db = getDb(ctx);
  const result = await db.execute("SELECT * FROM coupons ORDER BY created_at DESC");
  return json({ items: result.rows });
}

export async function POST(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const body = await readBody(ctx);
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
  const startAt = sanitizeText(String(body.start_at || ""));
  const endAt = sanitizeText(String(body.end_at || ""));
  const minOrder = asInt(body.min_order, 0);
  const maxDiscount = asInt(body.max_discount, 0);
  const usageLimit = asInt(body.usage_limit, 0);
  const perUserLimit = asInt(body.per_user_limit, 0);
  await db.execute({
    sql: `INSERT INTO coupons
            (id, code, type, value, min_order, max_discount, start_at, end_at, usage_limit, per_user_limit, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(),
      code,
      type,
      asInt(body.value, 0),
      minOrder > 0 ? minOrder : null,
      maxDiscount > 0 ? maxDiscount : null,
      startAt || null,
      endAt || null,
      usageLimit > 0 ? usageLimit : null,
      perUserLimit > 0 ? perUserLimit : null,
      body.is_active === "false" ? 0 : 1,
      now,
      now,
    ],
  });
  return json({ ok: true });
}
