import type { APIContext } from "astro";
import { getDb, initDb } from "../../../lib/db";
import { getEnv } from "../../../lib/env";
import { nowIso } from "../../../lib/utils";
import { getRequestId } from "../../../lib/api";

export async function POST(ctx: APIContext) {
    await initDb(ctx);
    const requestId = getRequestId(ctx);
    const env = getEnv(ctx);
    const body = (await ctx.request.json()) as any;

    const orderId = String(body.order_id || "");
    const statusCode = String(body.status_code || "");
    const grossAmount = String(body.gross_amount || "");
    const signatureKey = String(body.signature_key || "");

    const data = `${orderId}${statusCode}${grossAmount}${env.MIDTRANS_SERVER_KEY}`;
    const signature = await crypto.subtle.digest(
        "SHA-512",
        new TextEncoder().encode(data),
    );
    const computed = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    if (computed !== signatureKey) {
        console.warn("[midtrans.invalid_signature]", {
            request_id: requestId,
            order_id: orderId,
        });
        return new Response("Invalid signature", {
            status: 403,
            headers: { "X-Request-Id": requestId },
        });
    }

    const transactionStatus = String(body.transaction_status || "");
    let paymentStatus = "unpaid";
    let orderStatus = "pending";
    let invoiceStatus = "issued";

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
        paymentStatus = "paid";
        orderStatus = "processing";
        invoiceStatus = "paid";
    } else if (transactionStatus === "cancel" || transactionStatus === "deny") {
        paymentStatus = "failed";
        orderStatus = "cancelled";
        invoiceStatus = "void";
    } else if (transactionStatus === "expire") {
        paymentStatus = "expired";
        orderStatus = "expired";
        invoiceStatus = "expired";
    }

    const db = getDb(ctx);
    const existingOrderRes = await db.execute({
        sql: "SELECT id, payment_status FROM orders WHERE order_no = ?",
        args: [orderId],
    });
    const existingOrder = existingOrderRes.rows[0] as
        | { id?: string; payment_status?: string }
        | undefined;
    if (!existingOrder?.id) {
        return new Response("Order tidak ditemukan", {
            status: 404,
            headers: { "X-Request-Id": requestId },
        });
    }
    const wasPaid = existingOrder.payment_status === "paid";

    await db.execute({
        sql: "UPDATE orders SET payment_status = ?, status = ?, updated_at = ? WHERE order_no = ?",
        args: [paymentStatus, orderStatus, nowIso(), orderId],
    });
    await db.execute({
        sql: "UPDATE invoices SET status = ?, updated_at = ? WHERE order_id = (SELECT id FROM orders WHERE order_no = ?)",
        args: [invoiceStatus, nowIso(), orderId],
    });
    await db.execute({
        sql: "INSERT INTO order_status_history (id, order_id, status, notes, created_at) VALUES (?, (SELECT id FROM orders WHERE order_no = ?), ?, ?, ?)",
        args: [
            crypto.randomUUID(),
            orderId,
            orderStatus,
            `Midtrans: ${transactionStatus}`,
            nowIso(),
        ],
    });

    if (paymentStatus === "paid" && !wasPaid) {
        const orderRes = await db.execute({
            sql: "SELECT id, coupon_code, customer_phone, items_json FROM orders WHERE order_no = ?",
            args: [orderId],
        });
        const order = orderRes.rows[0] as any;
        if (order?.coupon_code) {
            const couponRes = await db.execute({
                sql: "SELECT id FROM coupons WHERE code = ?",
                args: [order.coupon_code],
            });
            const coupon = couponRes.rows[0] as any;
            if (coupon?.id) {
                const existing = await db.execute({
                    sql: "SELECT COUNT(*) as count FROM coupon_usages WHERE order_id = ?",
                    args: [order.id],
                });
                const count = Number((existing.rows[0] as any)?.count || 0);
                if (count === 0) {
                    await db.execute({
                        sql: "INSERT INTO coupon_usages (id, coupon_id, order_id, customer_phone, created_at) VALUES (?, ?, ?, ?, ?)",
                        args: [
                            crypto.randomUUID(),
                            coupon.id,
                            order.id,
                            order.customer_phone || null,
                            nowIso(),
                        ],
                    });
                }
            }
        }
        if (order?.items_json) {
            try {
                const items = JSON.parse(String(order.items_json));
                if (Array.isArray(items)) {
                    for (const item of items) {
                        const qty = Number(item.qty || 0);
                        await db.execute({
                            sql: "UPDATE products SET stock = CASE WHEN stock IS NULL THEN NULL ELSE MAX(stock - ?, 0) END WHERE id = ?",
                            args: [qty, item.product_id],
                        });
                        await db.execute({
                            sql: `INSERT INTO inventory_movements (id, product_id, type, qty, notes, ref_order_no, created_at)
                                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            args: [
                                crypto.randomUUID(),
                                item.product_id,
                                "sale",
                                -Math.abs(qty),
                                "Pembayaran berhasil",
                                orderId,
                                nowIso(),
                            ],
                        });
                    }
                }
            } catch {
                // ignore stock update errors
            }
        }
        if (order?.customer_phone) {
            await db.execute({
                sql: `INSERT INTO notifications (id, channel, recipient, template, payload_json, status, created_at, sent_at, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    crypto.randomUUID(),
                    "whatsapp",
                    order.customer_phone,
                    "order_paid",
                    JSON.stringify({ order_no: orderId }),
                    "pending",
                    nowIso(),
                    null,
                    nowIso(),
                ],
            });
        }
    }

    return new Response("OK", {
        status: 200,
        headers: { "X-Request-Id": requestId },
    });
}
