import type { APIContext } from "astro";
import { getRequestId, json, readBody } from "@lib/api";
import { getClientIp, sanitizeText } from "@lib/auth";
import { applyCoupon, calculateShipping } from "@lib/checkout";
import { getDb, initDb } from "@lib/db";
import { getEnv, isProduction } from "@lib/env";
import { checkRateLimit } from "@lib/rate-limit";
import { loadSettings } from "@lib/settings";
import { asInt, nowIso } from "@lib/utils";

type CartItem = {
  product_id: string;
  qty: number;
};

type CheckoutAddress = {
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  delivery_date?: string;
  delivery_time?: string;
};

type OrderItemRow = {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  total: number;
};

type ProductRow = {
  id?: string;
  name?: string;
  price?: number;
  stock?: number | null;
};

type MidtransSnapResponse = {
  token?: string;
};

function isValidEmail(value: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

export async function POST(ctx: APIContext) {
  await initDb(ctx);
  const requestId = getRequestId(ctx);
  const ip = getClientIp(ctx);
  const limit = await checkRateLimit(ctx, `checkout:${ip}`, 12, 60);
  if (!limit.ok) {
    return new Response("Too many requests. Try again later.", {
      status: 429,
      headers: { "X-Request-Id": requestId },
    });
  }
  const body = await readBody(ctx);
  const dryRun = body.dry_run === true || body.dry_run === "true";

  const customerName = sanitizeText(String(body.customer_name || ""));
  const customerPhone = sanitizeText(String(body.customer_phone || ""));
  const customerEmail = sanitizeText(String(body.customer_email || ""));
  const deliveryDate = body.delivery_date ? String(body.delivery_date) : null;
  const deliveryTime = body.delivery_time ? String(body.delivery_time) : null;

  const address =
    body.shipping_address && typeof body.shipping_address === "object"
      ? ({
          ...(body.shipping_address as CheckoutAddress),
        } satisfies CheckoutAddress)
      : ({} satisfies CheckoutAddress);
  if (deliveryDate) address.delivery_date = deliveryDate;
  if (deliveryTime) address.delivery_time = deliveryTime;

  const items = Array.isArray(body.items) ? (body.items as CartItem[]) : [];
  const couponCode = body.coupon_code ? String(body.coupon_code) : null;

  if (!customerName || !customerPhone || items.length === 0) {
    return new Response("Checkout data is incomplete", {
      status: 400,
      headers: { "X-Request-Id": requestId },
    });
  }
  if (customerName.length < 2 || customerName.length > 120) {
    return new Response("Invalid customer name", {
      status: 400,
      headers: { "X-Request-Id": requestId },
    });
  }
  const normalizedPhone = normalizePhone(customerPhone);
  if (normalizedPhone.length < 9 || normalizedPhone.length > 15) {
    return new Response("Invalid WhatsApp number", {
      status: 400,
      headers: { "X-Request-Id": requestId },
    });
  }
  if (!isValidEmail(customerEmail)) {
    return new Response("Invalid email format", {
      status: 400,
      headers: { "X-Request-Id": requestId },
    });
  }
  if (items.length > 50) {
    return new Response("Item quantity exceeds limit", {
      status: 400,
      headers: { "X-Request-Id": requestId },
    });
  }
  if (couponCode && couponCode.length > 50) {
    return new Response("Coupon code is too long", {
      status: 400,
      headers: { "X-Request-Id": requestId },
    });
  }
  if (address.street && String(address.street).length > 300) {
    return new Response("Address is too long", {
      status: 400,
      headers: { "X-Request-Id": requestId },
    });
  }

  const db = getDb(ctx);
  let subtotal = 0;
  const orderItems: OrderItemRow[] = [];

  for (const item of items) {
    const productRes = await db.execute({
      sql: "SELECT id, name, price, stock FROM products WHERE id = ? AND is_active = 1",
      args: [item.product_id],
    });
    const product = productRes.rows[0] as ProductRow | undefined;
    if (!product?.id || !product.name || product.price === undefined) {
      return new Response("Product not found", {
        status: 400,
        headers: { "X-Request-Id": requestId },
      });
    }
    const qty = Math.max(1, asInt(item.qty, 1));
    if (product.stock !== null && product.stock !== undefined) {
      if (Number(product.stock) < qty) {
        return new Response(`Insufficient stock for ${product.name}`, {
          status: 400,
          headers: { "X-Request-Id": requestId },
        });
      }
    }
    const price = Number(product.price);
    const lineTotal = price * qty;
    subtotal += lineTotal;
    orderItems.push({
      product_id: product.id,
      name: product.name,
      price,
      qty,
      total: lineTotal,
    });
  }

  const settings = await loadSettings(ctx);
  const orderSettings = settings.order_settings || {};

  if (orderSettings.preorder_only && !deliveryDate) {
    return new Response("Delivery date is required", {
      status: 400,
      headers: { "X-Request-Id": requestId },
    });
  }
  if (deliveryDate) {
    const now = Date.now();
    const leadHours = Number(orderSettings.minimum_lead_time_hours || 0);
    const minTime = now + leadHours * 60 * 60 * 1000;
    const requested = Date.parse(`${deliveryDate}T${deliveryTime || "08:00"}:00`);
    if (!Number.isNaN(requested) && requested < minTime) {
      return new Response("Delivery time does not meet minimum lead time", {
        status: 400,
        headers: { "X-Request-Id": requestId },
      });
    }
    if (orderSettings.same_day_enabled === false) {
      const today = new Date().toISOString().split("T")[0];
      if (deliveryDate === today) {
        return new Response("Same-day order is not available", {
          status: 400,
          headers: { "X-Request-Id": requestId },
        });
      }
    }
  }

  const { discount, freeShipping, coupon } = await applyCoupon(ctx, couponCode, subtotal, normalizedPhone);
  if (couponCode && !coupon) {
    return new Response("Invalid coupon or quota exhausted", {
      status: 400,
      headers: { "X-Request-Id": requestId },
    });
  }
  const deliverySettings = settings.delivery_settings || {};
  if (deliverySettings.delivery_province) {
    const province = String(address.province || "");
    if (province && province !== deliverySettings.delivery_province) {
      return new Response("Delivery area is restricted", {
        status: 400,
        headers: { "X-Request-Id": requestId },
      });
    }
  }
  const freeThreshold = Number(deliverySettings.free_delivery_threshold || 0);
  const freeByThreshold = freeThreshold > 0 && subtotal >= freeThreshold;
  const shippingResult = await calculateShipping(
    ctx,
    subtotal,
    {
      province: address.province || "",
      city: address.city || "",
      district: address.district || "",
    },
    freeShipping || freeByThreshold,
  );
  const deliveryFee = shippingResult.fee;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  if (dryRun) {
    return json(
      {
        ok: true,
        dry_run: true,
        subtotal,
        discount,
        delivery_fee: deliveryFee,
        total,
      },
      200,
      { "X-Request-Id": requestId },
    );
  }

  const orderId = crypto.randomUUID();
  const orderNo = `RS-${Date.now()}`;
  const now = nowIso();

  const customerRes = await db.execute({
    sql: "SELECT id FROM customers WHERE phone = ? OR (email IS NOT NULL AND email = ?) LIMIT 1",
    args: [normalizedPhone, customerEmail || ""],
  });
  const existingCustomer = customerRes.rows[0] as { id?: string } | undefined;
  const customerId = existingCustomer?.id || crypto.randomUUID();
  if (existingCustomer?.id) {
    await db.execute({
      sql: "UPDATE customers SET name = ?, email = ?, phone = ?, updated_at = ? WHERE id = ?",
      args: [customerName, customerEmail || null, normalizedPhone, now, customerId],
    });
  } else {
    await db.execute({
      sql: "INSERT INTO customers (id, name, email, phone, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [customerId, customerName, customerEmail || null, normalizedPhone, null, now, now],
    });
  }

  await db.execute({
    sql: `INSERT INTO orders 
            (id, order_no, status, payment_status, customer_name, customer_email, customer_phone, 
             shipping_address_json, items_json, subtotal, discount_total, delivery_fee, total, coupon_code, promo_json,
             created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      orderId,
      orderNo,
      "pending",
      "unpaid",
      customerName,
      customerEmail || null,
      normalizedPhone,
      JSON.stringify(address),
      JSON.stringify(orderItems),
      subtotal,
      discount,
      deliveryFee,
      total,
      coupon?.code || null,
      JSON.stringify({
        shipping_rule: shippingResult.rule,
        coupon_type: coupon?.type || null,
      }),
      now,
      now,
    ],
  });

  const env = getEnv(ctx);
  const midtransBase = isProduction(ctx)
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const payload = {
    transaction_details: {
      order_id: orderNo,
      gross_amount: total,
    },
    customer_details: {
      first_name: customerName,
      email: customerEmail || undefined,
      phone: normalizedPhone,
    },
    item_details: orderItems.map((item) => ({
      id: item.product_id,
      name: item.name,
      price: item.price,
      quantity: item.qty,
    })),
  };

  const auth = btoa(`${env.MIDTRANS_SERVER_KEY}:`);
  const midtransRes = await fetch(midtransBase, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(payload),
  });

  if (!midtransRes.ok) {
    const errText = await midtransRes.text();
    console.error("[checkout.midtrans_error]", {
      request_id: requestId,
      status: midtransRes.status,
      detail: errText.slice(0, 300),
    });
    return new Response("Failed to create payment transaction", {
      status: 500,
      headers: { "X-Request-Id": requestId },
    });
  }
  const midtransData = (await midtransRes.json()) as MidtransSnapResponse;
  if (!midtransData?.token) {
    return new Response("Invalid payment response", {
      status: 500,
      headers: { "X-Request-Id": requestId },
    });
  }
  await db.execute({
    sql: "UPDATE orders SET midtrans_token = ?, midtrans_order_id = ?, updated_at = ? WHERE id = ?",
    args: [midtransData.token, orderNo, nowIso(), orderId],
  });

  return json(
    {
      ok: true,
      order_id: orderId,
      order_no: orderNo,
      snap_token: midtransData.token,
      total,
    },
    200,
    { "X-Request-Id": requestId },
  );
}
