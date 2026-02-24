import type { APIContext } from "astro";
import { initDb, getDb } from "../../lib/db";
import { json, getRequestId } from "../../lib/api";
import { checkRateLimit } from "../../lib/rate-limit";
import { getClientIp } from "../../lib/auth";

function normalizePhone(value: string) {
    return value.replace(/[^\d]/g, "");
}

export async function GET(ctx: APIContext) {
    await initDb(ctx);
    const requestId = getRequestId(ctx);
    const ip = getClientIp(ctx);
    const limit = await checkRateLimit(ctx, `order-status:${ip}`, 30, 60);
    if (!limit.ok) {
        return new Response("Terlalu banyak permintaan. Coba lagi nanti.", {
            status: 429,
            headers: { "X-Request-Id": requestId },
        });
    }
    const url = new URL(ctx.request.url);
    const orderNo = url.searchParams.get("order_no");
    const phone = url.searchParams.get("phone");
    if (!orderNo || !phone) {
        return new Response("Order no dan nomor HP wajib diisi", {
            status: 400,
            headers: { "X-Request-Id": requestId },
        });
    }
    if (!/^RS-\d{10,}$/.test(orderNo)) {
        return new Response("Format order no tidak valid", {
            status: 400,
            headers: { "X-Request-Id": requestId },
        });
    }
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length < 9 || normalizedPhone.length > 15) {
        return new Response("Format nomor HP tidak valid", {
            status: 400,
            headers: { "X-Request-Id": requestId },
        });
    }
    const db = getDb(ctx);
    const result = await db.execute({
        sql: "SELECT status, payment_status, customer_phone FROM orders WHERE order_no = ?",
        args: [orderNo],
    });
    const row = result.rows[0] as
        | { status?: string; payment_status?: string; customer_phone?: string }
        | undefined;
    if (!row) {
        return new Response("Order tidak ditemukan", {
            status: 404,
            headers: { "X-Request-Id": requestId },
        });
    }
    const samePhone =
        normalizePhone(String(row.customer_phone || "")) === normalizedPhone;
    if (!samePhone) {
        return new Response("Order tidak ditemukan", {
            status: 404,
            headers: { "X-Request-Id": requestId },
        });
    }
    return json(
        { status: row.status, payment_status: row.payment_status },
        200,
        { "X-Request-Id": requestId },
    );
}
