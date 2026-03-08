import type { APIContext } from "astro";
import { getDb } from "./db";

export async function checkRateLimit(
  ctx: APIContext,
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const db = getDb(ctx);
  const now = Math.floor(Date.now() / 1000);
  const res = await db.execute({
    sql: "SELECT count, reset_at FROM rate_limits WHERE key = ?",
    args: [key],
  });
  const row = res.rows[0] as { count?: number; reset_at?: number } | undefined;
  if (!row || !row.reset_at || row.reset_at <= now) {
    await db.execute({
      sql: "INSERT OR REPLACE INTO rate_limits (key, count, reset_at) VALUES (?, ?, ?)",
      args: [key, 1, now + windowSeconds],
    });
    return { ok: true, remaining: limit - 1 };
  }
  if (Number(row.count) >= limit) {
    return { ok: false, remaining: 0, reset_at: row.reset_at };
  }
  const nextCount = Number(row.count) + 1;
  await db.execute({
    sql: "UPDATE rate_limits SET count = ? WHERE key = ?",
    args: [nextCount, key],
  });
  return { ok: true, remaining: limit - nextCount, reset_at: row.reset_at };
}
