import type { APIContext } from "astro";
import { logAudit } from "@lib/admin";
import { requireAdmin, sanitizeText, verifyCsrf } from "@lib/auth";
import { getDb, initDb } from "@lib/db";
import { nowIso } from "@lib/utils";

export async function PUT(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const body = (await ctx.request.json()) as Record<string, unknown>;
  if (!verifyCsrf(ctx, body)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }
  const id = ctx.params.id || "";
  const channel = sanitizeText(String(body.channel || ""));
  const recipient = sanitizeText(String(body.recipient || ""));
  const status = sanitizeText(String(body.status || ""));
  if (!id || !channel || !recipient) {
    return new Response("Invalid data", { status: 400 });
  }
  const db = getDb(ctx);
  await db.execute({
    sql: `UPDATE notifications SET channel = ?, recipient = ?, status = ?, updated_at = ? WHERE id = ?`,
    args: [channel, recipient, status || "pending", nowIso(), id],
  });
  await logAudit(ctx, "update_notification", "notification", id, {
    channel,
    recipient,
    status,
  });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const body = ctx.request.headers.get("content-type")?.includes("application/json")
    ? await ctx.request.json()
    : Object.fromEntries(await ctx.request.formData());
  if (!verifyCsrf(ctx, body)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }
  const id = ctx.params.id || "";
  const db = getDb(ctx);
  await db.execute({
    sql: "DELETE FROM notifications WHERE id = ?",
    args: [id],
  });
  await logAudit(ctx, "delete_notification", "notification", id);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
