import type { APIContext } from "astro";
import { json } from "@lib/api";
import { requireAdmin } from "@lib/auth";
import { getDb, initDb } from "@lib/db";

type CountRow = { count?: number | string | null };

export async function GET(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const url = new URL(ctx.request.url);
  const q = String(url.searchParams.get("q") || "").trim();
  const status = String(url.searchParams.get("status") || "").trim();
  const paymentStatus = String(url.searchParams.get("payment_status") || "").trim();
  const dateFrom = String(url.searchParams.get("date_from") || "").trim();
  const dateTo = String(url.searchParams.get("date_to") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
  const offset = (page - 1) * limit;
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
  const where = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
  const db = getDb(ctx);
  const result = await db.execute({
    sql: `SELECT id, order_no, status, payment_status, customer_name, total, created_at
              FROM orders ${where}
              ORDER BY created_at DESC
              LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  });
  const countRes = await db.execute({
    sql: `SELECT COUNT(*) as count FROM orders ${where}`,
    args,
  });
  const countRow = countRes.rows[0] as CountRow | undefined;
  const total = Number(countRow?.count || 0);
  return json({ items: result.rows, page, limit, total });
}
