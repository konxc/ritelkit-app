import type { APIContext } from "astro";
import { logAudit } from "../../../lib/admin";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";
import { nowIso } from "../../../lib/utils";

export async function POST(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const body = Object.fromEntries(await ctx.request.formData());
  if (!verifyCsrf(ctx, body)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }
  const channel = sanitizeText(String(body.channel || ""));
  const recipient = sanitizeText(String(body.recipient || ""));
  const template = sanitizeText(String(body.template || ""));
  const payloadJson = String(body.payload_json || "");
  if (!channel || !recipient) {
    return new Response("Channel and recipient are required", { status: 400 });
  }
  const db = getDb(ctx);
  const id = crypto.randomUUID();
  const now = nowIso();
  await db.execute({
    sql: `INSERT INTO notifications (id, channel, recipient, template, payload_json, status, created_at, sent_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      channel,
      recipient,
      template || null,
      payloadJson || null,
      "pending",
      now,
      null,
      now,
    ],
  });
  await logAudit(ctx, "create", "notification", id, { channel, recipient });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
