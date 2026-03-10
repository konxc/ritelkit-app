import type { APIContext } from "astro";
import { logAudit } from "../../../../lib/admin";
import { hashPassword, requireAdmin, sanitizeText, verifyCsrf } from "../../../../lib/auth";
import { getDb, initDb } from "../../../../lib/db";

export async function PUT(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const body = (await ctx.request.json()) as Record<string, unknown>;
  if (!verifyCsrf(ctx, body)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }
  const id = ctx.params.id || "";
  const role = sanitizeText(String(body.role || "admin"));
  const password = sanitizeText(String(body.password || ""));
  const db = getDb(ctx);
  if (password) {
    if (password.length < 8) {
      return new Response("Password must be at least 8 characters", { status: 400 });
    }
    const hash = await hashPassword(password);
    await db.execute({
      sql: "UPDATE admin_users SET role = ?, password_hash = ? WHERE id = ?",
      args: [role, hash, id],
    });
  } else {
    await db.execute({
      sql: "UPDATE admin_users SET role = ? WHERE id = ?",
      args: [role, id],
    });
  }
  await logAudit(ctx, "update_admin_user", "admin_user", id, { role });
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
  await db.execute({ sql: "DELETE FROM admin_users WHERE id = ?", args: [id] });
  await logAudit(ctx, "delete_admin_user", "admin_user", id);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
