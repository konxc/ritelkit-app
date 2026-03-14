import type { APIContext } from "astro";
import { logAudit } from "@lib/admin";
import { requireAdmin, sanitizeText, verifyCsrf } from "@lib/auth";
import { getDb, initDb } from "@lib/db";
import { getEnv, isProduction } from "@lib/env";
import { asInt, nowIso } from "@lib/utils";

type MidtransOrderRow = {
  midtrans_order_id?: string | null;
};

export async function POST(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const body = Object.fromEntries(await ctx.request.formData());
  if (!verifyCsrf(ctx, body)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }
  const orderNo = sanitizeText(String(body.order_no || ""));
  const amount = asInt(body.amount, 0);
  const status = sanitizeText(String(body.status || "requested"));
  const reason = sanitizeText(String(body.reason || ""));
  if (!orderNo || amount <= 0) {
    return new Response("Order and amount are required", { status: 400 });
  }
  const db = getDb(ctx);
  const now = nowIso();
  const id = crypto.randomUUID();
  await db.execute({
    sql: "INSERT INTO refunds (id, order_id, order_no, amount, reason, status, provider_status, provider_response_json, created_at, updated_at) VALUES (?, (SELECT id FROM orders WHERE order_no = ?), ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, orderNo, orderNo, amount, reason || null, status, null, null, now, now],
  });
  if (status === "approved") {
    await db.execute({
      sql: "UPDATE orders SET status = ?, payment_status = ?, updated_at = ? WHERE order_no = ?",
      args: ["refunded", "refunded", now, orderNo],
    });
    const orderRes = await db.execute({
      sql: "SELECT midtrans_order_id FROM orders WHERE order_no = ?",
      args: [orderNo],
    });
    const orderRow = orderRes.rows[0] as MidtransOrderRow | undefined;
    const midtransOrderId = String(orderRow?.midtrans_order_id || "");
    if (midtransOrderId) {
      const env = getEnv(ctx);
      const base = isProduction(ctx) ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
      const auth = btoa(`${env.MIDTRANS_SERVER_KEY}:`);
      try {
        const res = await fetch(`${base}/v2/${midtransOrderId}/refund`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({ amount, reason }),
        });
        const text = await res.text();
        await db.execute({
          sql: "UPDATE refunds SET provider_status = ?, provider_response_json = ?, updated_at = ? WHERE id = ?",
          args: [res.ok ? "ok" : "error", text, nowIso(), id],
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await db.execute({
          sql: "UPDATE refunds SET provider_status = ?, provider_response_json = ?, updated_at = ? WHERE id = ?",
          args: ["error", message, nowIso(), id],
        });
      }
    }
  }
  await logAudit(ctx, "create_refund", "refund", id, {
    order_no: orderNo,
    amount,
    status,
  });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
