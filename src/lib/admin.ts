import type { APIContext } from "astro";
import { getDb } from "./db";
import { nowIso } from "./utils";
import { getAdminSession } from "./auth";

export async function logAudit(
    ctx: APIContext,
    action: string,
    entityType: string,
    entityId?: string,
    data?: unknown,
) {
    const db = getDb(ctx);
    const session = await getAdminSession(ctx);
    await db.execute({
        sql: `INSERT INTO audit_logs (id, actor_email, action, entity_type, entity_id, data_json, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
            crypto.randomUUID(),
            session?.email || null,
            action,
            entityType,
            entityId || null,
            data ? JSON.stringify(data) : null,
            nowIso(),
        ],
    });
}

export function parsePage(url: URL, pageSize = 20) {
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const q = String(url.searchParams.get("q") || "").trim();
    const offset = (page - 1) * pageSize;
    return { page, q, offset, limit: pageSize };
}
