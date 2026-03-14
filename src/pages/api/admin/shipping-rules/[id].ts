import type { APIContext } from "astro";
import { json, readBody } from "@lib/api";
import { logAudit } from "@lib/admin";
import { requireAdmin, sanitizeText, verifyCsrf } from "@lib/auth";
import { getDb, initDb } from "@lib/db";
import { asInt, nowIso } from "@lib/utils";

export async function PUT(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const id = ctx.params.id;
  if (!id) return new Response("Invalid ID", { status: 400 });
  const body = await readBody(ctx);
  if (!verifyCsrf(ctx, body)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }
  const name = sanitizeText(String(body.name || ""));
  const type = sanitizeText(String(body.type || ""));
  if (!name || !type) {
    return new Response("Name and rule type are required", { status: 400 });
  }
  const db = getDb(ctx);
  await db.execute({
    sql: `UPDATE shipping_rules SET
            name = ?, type = ?, priority = ?, is_active = ?, config_json = ?, updated_at = ?
            WHERE id = ?`,
    args: [
      name,
      type,
      asInt(body.priority, 100),
      body.is_active === "false" ? 0 : 1,
      JSON.stringify(body.config ?? {}),
      nowIso(),
      id,
    ],
  });
  await logAudit(ctx, "update_shipping_rule", "shipping_rule", id, { name, type });
  return json({ ok: true });
}

export async function DELETE(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  if (!verifyCsrf(ctx)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }
  const id = ctx.params.id;
  if (!id) return new Response("Invalid ID", { status: 400 });
  const db = getDb(ctx);
  await db.execute({
    sql: "DELETE FROM shipping_rules WHERE id = ?",
    args: [id],
  });
  await logAudit(ctx, "delete_shipping_rule", "shipping_rule", id);
  return json({ ok: true });
}
