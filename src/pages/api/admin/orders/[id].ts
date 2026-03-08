import type { APIContext } from "astro";
import { json, readBody } from "../../../../lib/api";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../../lib/auth";
import { getDb, initDb } from "../../../../lib/db";
import { validateOrderUpdate } from "../../../../lib/order";
import { nowIso } from "../../../../lib/utils";

export async function GET(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const id = ctx.params.id;
  if (!id) return new Response("ID tidak valid", { status: 400 });
  const db = getDb(ctx);
  const result = await db.execute({
    sql: "SELECT * FROM orders WHERE id = ?",
    args: [id],
  });
  return json({ item: result.rows[0] ?? null });
}

export async function PUT(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const id = ctx.params.id;
  if (!id) return new Response("ID tidak valid", { status: 400 });
  const body = await readBody(ctx);
  if (!verifyCsrf(ctx, body)) {
    return new Response("CSRF token tidak valid", { status: 403 });
  }
  const status = sanitizeText(String(body.status || ""));
  const paymentStatus = sanitizeText(String(body.payment_status || ""));
  const db = getDb(ctx);
  const currentRes = await db.execute({
    sql: "SELECT status, payment_status FROM orders WHERE id = ?",
    args: [id],
  });
  const current = currentRes.rows[0] as { status?: string; payment_status?: string } | undefined;
  if (!current?.status || !current?.payment_status) {
    return new Response("Pesanan tidak ditemukan", { status: 404 });
  }
  const validation = validateOrderUpdate(
    current.status,
    status,
    current.payment_status,
    paymentStatus,
  );
  if (!validation.ok) {
    return new Response(validation.message || "Transisi tidak valid", {
      status: 400,
    });
  }
  await db.execute({
    sql: "UPDATE orders SET status = ?, payment_status = ?, updated_at = ? WHERE id = ?",
    args: [status, paymentStatus, nowIso(), id],
  });
  await db.execute({
    sql: "INSERT INTO order_status_history (id, order_id, status, notes, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [
      crypto.randomUUID(),
      id,
      status,
      sanitizeText(String(body.notes || "")) || null,
      nowIso(),
    ],
  });
  return json({ ok: true });
}
