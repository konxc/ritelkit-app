import type { APIContext } from "astro";
import { getDrizzle } from "../lib/db";
import { requireAdmin } from "../lib/auth";

export async function createContext(ctx: APIContext) {
  const admin = await requireAdmin(ctx);
  const db = getDrizzle(ctx);
  return {
    db,
    admin,
    ctx,
  };
}
