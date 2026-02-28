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

	const productId = String(body.product_id || "");
	const type = sanitizeText(String(body.type || "adjustment"));
	const qty = asInt(body.qty, 0);
	const notes = sanitizeText(String(body.notes || ""));
	if (!productId || qty === 0) {
		return new Response("Produk dan qty wajib diisi", { status: 400 });
	}

	const db = getDb(ctx);
	const productRes = await db.execute({
		sql: "SELECT stock FROM products WHERE id = ?",
		args: [productId],
	});
	const product = productRes.rows[0] as { stock?: number } | undefined;
	if (!product) {
		return new Response("Produk tidak ditemukan", { status: 404 });
	}

	let signedQty = qty;
	if (type === "out") signedQty = -Math.abs(qty);
	if (type === "in") signedQty = Math.abs(qty);
	if (type === "adjustment") signedQty = qty;

	await db.execute({
		sql: `INSERT INTO inventory_movements (id, product_id, type, qty, notes, ref_order_no, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
		args: [
			crypto.randomUUID(),
			productId,
			type,
			signedQty,
			notes || null,
			null,
			nowIso(),
		],
	});
	await db.execute({
		sql: "UPDATE products SET stock = CASE WHEN stock IS NULL THEN NULL ELSE MAX(stock + ?, 0) END WHERE id = ?",
		args: [signedQty, productId],
	});
	await logAudit(ctx, "create", "inventory_movement", productId, {
		type,
		qty: signedQty,
	});

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}
