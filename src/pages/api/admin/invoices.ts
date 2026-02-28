import type { APIContext } from "astro";
import { json, readBody } from "../../../lib/api";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";
import { nowIso } from "../../../lib/utils";

type OrderLookupRow = { id?: string };

export async function GET(ctx: APIContext) {
	await initDb(ctx);
	const admin = await requireAdmin(ctx);
	if (!admin) return new Response("Unauthorized", { status: 401 });
	const db = getDb(ctx);
	const result = await db.execute(
		`SELECT i.invoice_no, i.status, i.issued_at, o.order_no, o.total
         FROM invoices i
         JOIN orders o ON o.id = i.order_id
         ORDER BY i.created_at DESC`,
	);
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
	const orderNo = sanitizeText(String(body.order_no || ""));
	if (!orderNo) return new Response("Order no wajib diisi", { status: 400 });
	const db = getDb(ctx);
	const orderRes = await db.execute({
		sql: "SELECT id FROM orders WHERE order_no = ?",
		args: [orderNo],
	});
	const order = orderRes.rows[0] as OrderLookupRow | undefined;
	if (!order?.id) return new Response("Order tidak ditemukan", { status: 404 });
	const invoiceNo = `INV-${Date.now()}`;
	const now = nowIso();
	await db.execute({
		sql: `INSERT INTO invoices (id, order_id, invoice_no, status, issued_at, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
		args: [crypto.randomUUID(), order.id, invoiceNo, "issued", now, now, now],
	});
	return json({ ok: true, invoice_no: invoiceNo });
}
