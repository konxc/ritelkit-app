import type { APIContext } from "astro";
import { logAudit } from "@/lib/admin";
import { requireAdmin, sanitizeText, verifyCsrf } from "@/lib/auth";
import { getDb, initDb } from "@/lib/db";
import { nowIso } from "@/lib/utils";

export async function PUT(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const body = (await ctx.request.json()) as Record<string, unknown>;
  if (!verifyCsrf(ctx, body)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }
  const id = ctx.params.id || "";
  const orderNo = sanitizeText(String(body.order_no || ""));
  const status = sanitizeText(String(body.status || ""));
  const carrier = sanitizeText(String(body.carrier || ""));
  const trackingNo = sanitizeText(String(body.tracking_no || ""));
  const notes = sanitizeText(String(body.notes || ""));
  if (!id || !orderNo || !status) {
    return new Response("Invalid data", { status: 400 });
  }
  const now = nowIso();
  const shippedAt = status === "shipped" ? now : null;
  const deliveredAt = status === "delivered" ? now : null;

  const db = getDb(ctx);
  await db.execute({
    sql: `UPDATE shipments SET order_no = ?, status = ?, carrier = ?, tracking_no = ?, notes = ?, 
              shipped_at = COALESCE(shipped_at, ?), delivered_at = COALESCE(delivered_at, ?), updated_at = ?
              WHERE id = ?`,
    args: [orderNo, status, carrier || null, trackingNo || null, notes || null, shippedAt, deliveredAt, now, id],
  });
  const orderStatus =
    status === "delivered"
      ? "delivered"
      : status === "shipped"
        ? "shipped"
        : status === "cancelled"
          ? "cancelled"
          : "processing";
  await db.execute({
    sql: "UPDATE orders SET status = ?, updated_at = ? WHERE order_no = ?",
    args: [orderStatus, now, orderNo],
  });
  await db.execute({
    sql: "INSERT INTO order_status_history (id, order_id, status, notes, created_at) VALUES (?, (SELECT id FROM orders WHERE order_no = ?), ?, ?, ?)",
    args: [crypto.randomUUID(), orderNo, orderStatus, "Updated from fulfillment", nowIso()],
  });
  await logAudit(ctx, "update_shipment", "shipment", id, { order_no: orderNo, status });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const body = ctx.request.headers.get("content-type")?.includes("application/json")
    ? await ctx.request.json()
    : Object.fromEntries(await ctx.request.formData());
  if (!verifyCsrf(ctx, body)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }
  const id = ctx.params.id || "";
  const db = getDb(ctx);
  await db.execute({ sql: "DELETE FROM shipments WHERE id = ?", args: [id] });
  await logAudit(ctx, "delete_shipment", "shipment", id);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
