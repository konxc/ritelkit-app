import type { APIContext } from "astro";
import { json, readBody } from "../../../../lib/api";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../../lib/auth";
import { getDb, initDb } from "../../../../lib/db";
import { asInt, nowIso } from "../../../../lib/utils";

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
	const code = sanitizeText(String(body.code || "")).toUpperCase();
	const type = sanitizeText(String(body.type || ""));
	if (!code || !type) {
		return new Response("Kode kupon dan tipe wajib diisi", {
			status: 400,
		});
	}
	const db = getDb(ctx);
	const startAt = sanitizeText(String(body.start_at || ""));
	const endAt = sanitizeText(String(body.end_at || ""));
	const minOrder = asInt(body.min_order, 0);
	const maxDiscount = asInt(body.max_discount, 0);
	const usageLimit = asInt(body.usage_limit, 0);
	const perUserLimit = asInt(body.per_user_limit, 0);
	await db.execute({
		sql: `UPDATE coupons SET
            code = ?, type = ?, value = ?, min_order = ?, max_discount = ?, start_at = ?, end_at = ?,
            usage_limit = ?, per_user_limit = ?, is_active = ?, updated_at = ?
            WHERE id = ?`,
		args: [
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
			nowIso(),
			id,
		],
	});
	return json({ ok: true });
}

export async function DELETE(ctx: APIContext) {
	await initDb(ctx);
	const admin = await requireAdmin(ctx);
	if (!admin) return new Response("Unauthorized", { status: 401 });
	if (!verifyCsrf(ctx)) {
		return new Response("CSRF token tidak valid", { status: 403 });
	}
	const id = ctx.params.id;
	if (!id) return new Response("ID tidak valid", { status: 400 });
	const db = getDb(ctx);
	await db.execute({ sql: "DELETE FROM coupons WHERE id = ?", args: [id] });
	return json({ ok: true });
}
