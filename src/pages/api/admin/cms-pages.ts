import type { APIContext } from "astro";
import { logAudit } from "../../../lib/admin";
import { requireAdmin, sanitizeText, verifyCsrf } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";
import { nowIso } from "../../../lib/utils";

export async function POST(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const contentType = ctx.request.headers.get("content-type") || "";
  const body = (
    contentType.includes("application/json")
      ? await ctx.request.json()
      : Object.fromEntries(await ctx.request.formData())
  ) as Record<string, unknown>;
  if (!verifyCsrf(ctx, body)) {
    return new Response("CSRF token tidak valid", { status: 403 });
  }
  const title = sanitizeText(String(body.title || ""));
  const slug = sanitizeText(String(body.slug || ""));
  const content = String(body.content_md || "");
  const isActive = String(body.is_active || "true") === "true";
  if (!title || !slug || !content) {
    return new Response("Judul, slug, dan konten wajib diisi", { status: 400 });
  }
  const now = nowIso();
  const db = getDb(ctx);
  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO cms_pages (id, slug, title, content_md, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, slug, title, content, isActive ? 1 : 0, now, now],
  });
  await logAudit(ctx, "create", "cms_page", id, { slug, title });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
