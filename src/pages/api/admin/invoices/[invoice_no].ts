import type { APIContext } from "astro";
import { json, readBody } from "../../../../lib/api";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../../lib/auth";
import { getDb, initDb } from "../../../../lib/db";
import { nowIso } from "../../../../lib/utils";

export async function GET(ctx: APIContext) {
	await initDb(ctx);
	const admin = await requireAdmin(ctx);
	if (!admin) return new Response("Unauthorized", { status: 401 });
	const invoiceNo = ctx.params.invoice_no;
	if (!invoiceNo) return new Response("Invoice tidak valid", { status: 400 });
	const db = getDb(ctx);
	const result = await db.execute({
		sql: `SELECT i.*, o.order_no, o.customer_name, o.customer_phone, o.total, o.items_json, o.shipping_address_json
              FROM invoices i JOIN orders o ON o.id = i.order_id
              WHERE i.invoice_no = ?`,
		args: [invoiceNo],
	});
	return json({ item: result.rows[0] ?? null });
}

export async function PUT(ctx: APIContext) {
	await initDb(ctx);
	const admin = await requireAdmin(ctx);
	if (!admin) return new Response("Unauthorized", { status: 401 });
	const invoiceNo = ctx.params.invoice_no;
	if (!invoiceNo) return new Response("Invoice tidak valid", { status: 400 });
	const body = await readBody(ctx);
	if (!verifyCsrf(ctx, body)) {
		return new Response("CSRF token tidak valid", { status: 403 });
	}
	const status = sanitizeText(String(body.status || ""));
	const dueAt = body.due_at ? String(body.due_at) : null;
	const db = getDb(ctx);
	await db.execute({
		sql: "UPDATE invoices SET status = ?, due_at = ?, updated_at = ? WHERE invoice_no = ?",
		args: [status || "issued", dueAt, nowIso(), invoiceNo],
	});
	return json({ ok: true });
}
