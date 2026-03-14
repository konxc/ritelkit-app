import type { APIContext } from "astro";
import { json } from "@lib/api";
import { getDb, initDb } from "@lib/db";

export async function POST(ctx: APIContext) {
  await initDb(ctx);
  const db = getDb(ctx);
  const productRes = await db.execute("SELECT id FROM products WHERE is_active = 1 LIMIT 1");
  const product = productRes.rows[0] as any;
  if (!product) {
    return new Response("No active products for health check", {
      status: 400,
    });
  }
  const payload = {
    customer_name: "Health Check",
    customer_phone: "6280000000000",
    shipping_address: {
      province: "DI Yogyakarta",
      city: "Bantul",
      district: "Banguntapan",
      street: "Testing",
    },
    items: [{ product_id: product.id, qty: 1 }],
    dry_run: true,
  };

  const res = await fetch(new URL("/api/checkout", ctx.request.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return new Response(await res.text(), { status: 500 });
  }
  const data = await res.json();
  return json({ ok: true, checkout: data });
}
