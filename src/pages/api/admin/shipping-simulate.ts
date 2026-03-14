import type { APIContext } from "astro";
import { requireAdmin, verifyCsrf } from "@lib/auth";
import { initDb } from "@lib/db";
import { readBody, json } from "@lib/api";
import { calculateShipping } from "@lib/checkout";

export async function POST(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const body = (await readBody(ctx)) as any;
  if (!verifyCsrf(ctx, body)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }
  const subtotal = Number(body.subtotal || 0);
  const province = String(body.province || "");
  const city = String(body.city || "");
  const district = String(body.district || "");
  const freeShipping = body.free_shipping === true || body.free_shipping === "true";
  if (!province || !city) {
    return new Response("Province and city are required", { status: 400 });
  }
  const result = await calculateShipping(ctx, subtotal, { province, city, district }, freeShipping);
  return json(result);
}
