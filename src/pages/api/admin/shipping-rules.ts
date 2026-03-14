import type { APIContext } from "astro";
import { json, readBody } from "@/lib/api";
import { logAudit } from "@/lib/admin";
import { requireAdmin, sanitizeText, verifyCsrf } from "@/lib/auth";
import { getDb, initDb } from "@/lib/db";
import { asInt, nowIso } from "@/lib/utils";

type ShippingRuleConfig = {
  fee?: number;
  threshold?: number;
  zones?: unknown[];
};

export async function GET(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const db = getDb(ctx);
  const result = await db.execute("SELECT * FROM shipping_rules ORDER BY priority ASC, created_at DESC");
  return json({ items: result.rows });
}

export async function POST(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const body = await readBody(ctx);
  if (!verifyCsrf(ctx, body)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }
  const name = sanitizeText(String(body.name || ""));
  const type = sanitizeText(String(body.type || ""));
  if (!name || !type) {
    return new Response("Name and rule type are required", { status: 400 });
  }
  if (!["flat", "free_threshold", "zone"].includes(type)) {
    return new Response("Invalid rule type", { status: 400 });
  }
  const config = body.config && typeof body.config === "object" ? (body.config as ShippingRuleConfig) : {};
  if (type === "flat" && (!config || typeof config.fee !== "number")) {
    return new Response("Invalid flat fee config", { status: 400 });
  }
  if (
    type === "free_threshold" &&
    (!config || typeof config.threshold !== "number" || typeof config.fee !== "number")
  ) {
    return new Response("Invalid threshold config", { status: 400 });
  }
  if (type === "zone" && (!config || !Array.isArray(config.zones))) {
    return new Response("Invalid zone config", { status: 400 });
  }
  const now = nowIso();
  const db = getDb(ctx);
  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO shipping_rules
            (id, name, type, priority, is_active, config_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      name,
      type,
      asInt(body.priority, 100),
      body.is_active === "false" ? 0 : 1,
      JSON.stringify(config),
      now,
      now,
    ],
  });
  await logAudit(ctx, "create_shipping_rule", "shipping_rule", id, { name, type });
  return json({ ok: true });
}
