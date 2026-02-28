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

	const orderNo = sanitizeText(String(body.order_no || ""));
	const status = sanitizeText(String(body.status || "packing"));
	const carrier = sanitizeText(String(body.carrier || ""));
	const trackingNo = sanitizeText(String(body.tracking_no || ""));
	const notes = sanitizeText(String(body.notes || ""));
	if (!orderNo) {
		return new Response("Order no wajib diisi", { status: 400 });
	}

	const now = nowIso();
	const shippedAt = status === "shipped" ? now : null;
	const deliveredAt = status === "delivered" ? now : null;

	const db = getDb(ctx);
	const id = crypto.randomUUID();
	await db.execute({
		sql: `INSERT INTO shipments (id, order_no, status, carrier, tracking_no, shipped_at, delivered_at, notes, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		args: [
			id,
			orderNo,
			status,
			carrier || null,
			trackingNo || null,
			shippedAt,
			deliveredAt,
			notes || null,
			now,
			now,
		],
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
		args: [
			crypto.randomUUID(),
			orderNo,
			orderStatus,
			"Update dari fulfillment",
			nowIso(),
		],
	});
	await logAudit(ctx, "create", "shipment", id, { order_no: orderNo, status });
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}
