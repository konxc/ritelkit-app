import type { APIContext } from "astro";
import { requireAdmin } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";

function toCsv(rows: Record<string, unknown>[]) {
	if (rows.length === 0) return "";
	const headers = Object.keys(rows[0]);
	const escape = (val: unknown) => {
		const str = String(val ?? "");
		if (str.includes(",") || str.includes('"') || str.includes("\n")) {
			return `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};
	const lines = [headers.join(",")];
	for (const row of rows) {
		lines.push(headers.map((h) => escape(row[h])).join(","));
	}
	return lines.join("\n");
}

export async function GET(ctx: APIContext) {
	await initDb(ctx);
	const admin = await requireAdmin(ctx);
	if (!admin) return new Response("Unauthorized", { status: 401 });

	const url = new URL(ctx.request.url);
	const entity = url.searchParams.get("entity") || "";
	const db = getDb(ctx);
	let rows: Record<string, unknown>[] = [];
	let filename = "export.csv";

	if (entity === "orders") {
		const q = String(url.searchParams.get("q") || "").trim();
		const status = String(url.searchParams.get("status") || "").trim();
		const paymentStatus = String(
			url.searchParams.get("payment_status") || "",
		).trim();
		const dateFrom = String(url.searchParams.get("date_from") || "").trim();
		const dateTo = String(url.searchParams.get("date_to") || "").trim();
		const whereParts: string[] = [];
		const args: Array<string | number> = [];
		if (q) {
			whereParts.push("(order_no LIKE ? OR customer_name LIKE ?)");
			args.push(`%${q}%`, `%${q}%`);
		}
		if (status) {
			whereParts.push("status = ?");
			args.push(status);
		}
		if (paymentStatus) {
			whereParts.push("payment_status = ?");
			args.push(paymentStatus);
		}
		if (dateFrom) {
			whereParts.push("date(created_at) >= date(?)");
			args.push(dateFrom);
		}
		if (dateTo) {
			whereParts.push("date(created_at) <= date(?)");
			args.push(dateTo);
		}
		const where =
			whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
		const res = await db.execute({
			sql: `SELECT order_no, customer_name, customer_phone, total, status, payment_status, created_at
                  FROM orders ${where}
                  ORDER BY created_at DESC`,
			args,
		});
		rows = res.rows as Record<string, unknown>[];
		filename = "orders.csv";
	} else if (entity === "customers") {
		const res = await db.execute(
			"SELECT name, phone, email, notes, created_at FROM customers ORDER BY created_at DESC",
		);
		rows = res.rows as Record<string, unknown>[];
		filename = "customers.csv";
	} else if (entity === "products") {
		const res = await db.execute(
			"SELECT sku, name, price, stock, is_active, created_at FROM products ORDER BY created_at DESC",
		);
		rows = res.rows as Record<string, unknown>[];
		filename = "products.csv";
	} else if (entity === "inventory") {
		const res = await db.execute(
			"SELECT product_id, type, qty, notes, ref_order_no, created_at FROM inventory_movements ORDER BY created_at DESC",
		);
		rows = res.rows as Record<string, unknown>[];
		filename = "inventory.csv";
	} else if (entity === "refunds") {
		const res = await db.execute(
			"SELECT order_no, amount, status, reason, created_at FROM refunds ORDER BY created_at DESC",
		);
		rows = res.rows as Record<string, unknown>[];
		filename = "refunds.csv";
	} else {
		return new Response("Entity tidak didukung", { status: 400 });
	}

	const csv = toCsv(rows);
	return new Response(csv, {
		status: 200,
		headers: {
			"Content-Type": "text/csv",
			"Content-Disposition": `attachment; filename="${filename}"`,
		},
	});
}
