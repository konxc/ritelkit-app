import type { APIContext } from "astro";
import { auditLogs } from "../db/schema";
import { getAdminSession } from "./auth";
import { getDrizzle } from "./db";
import { nowIso } from "./utils";

export async function logAudit(ctx: APIContext, action: string, entityType: string, entityId?: string, data?: unknown) {
  const db = getDrizzle(ctx);
  const session = await getAdminSession(ctx);
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorEmail: session?.email || null,
    action,
    entityType,
    entityId: entityId || null,
    dataJson: data ? JSON.stringify(data) : null,
    createdAt: nowIso(),
  });
}

export function parsePage(url: URL, pageSize = 20) {
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const q = String(url.searchParams.get("q") || "").trim();
  const offset = (page - 1) * pageSize;
  return { page, q, offset, limit: pageSize };
}

type TabConfig<T extends string> = {
  allowed: readonly T[];
  defaultTab: T;
  aliases?: Record<string, T>;
};

export function normalizeTab<T extends string>(raw: string | null, config: TabConfig<T>): T {
  const value = (raw || "").toLowerCase().trim();
  if (value && config.aliases?.[value]) return config.aliases[value];
  if (config.allowed.includes(value as T)) return value as T;
  return config.defaultTab;
}
