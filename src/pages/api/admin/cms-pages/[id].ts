import type { APIContext } from "astro";
import { logAudit } from "../../../../lib/admin";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../../lib/auth";
import { getDb, initDb } from "../../../../lib/db";
import { nowIso } from "../../../../lib/utils";

type CmsContentRow = {
  content_md?: string | null;
};

export async function GET(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const id = ctx.params.id || "";
  const db = getDb(ctx);
  const res = await db.execute({
    sql: "SELECT content_md FROM cms_pages WHERE id = ?",
    args: [id],
  });
  const row = res.rows[0] as CmsContentRow | undefined;
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify({ content_md: row.content_md }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const body = (await ctx.request.json()) as Record<string, unknown>;
  if (!verifyCsrf(ctx, body)) {
    return new Response("CSRF token tidak valid", { status: 403 });
  }
  const id = ctx.params.id || "";
  const title = sanitizeText(String(body.title || ""));
  const slug = sanitizeText(String(body.slug || ""));
  const content = String(body.content_md || "");
  const isActive = String(body.is_active || "true") === "true";
  if (!id || !title || !slug || !content) {
    return new Response("Data tidak valid", { status: 400 });
  }
  const db = getDb(ctx);
  await db.execute({
    sql: "UPDATE cms_pages SET title = ?, slug = ?, content_md = ?, is_active = ?, updated_at = ? WHERE id = ?",
    args: [title, slug, content, isActive ? 1 : 0, nowIso(), id],
  });
  await logAudit(ctx, "update", "cms_page", id, { slug, title });
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
    return new Response("CSRF token tidak valid", { status: 403 });
  }
  const id = ctx.params.id || "";
  const db = getDb(ctx);
  await db.execute({ sql: "DELETE FROM cms_pages WHERE id = ?", args: [id] });
  await logAudit(ctx, "delete", "cms_page", id);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
