import type { APIContext } from "astro";
import { getEnv } from "./env";
import { getDrizzle } from "./db";
import { tenants } from "@db/schema";
import { eq } from "drizzle-orm";

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
}

export async function resolveTenant(ctx: APIContext): Promise<TenantInfo | null> {
  const env = getEnv(ctx);
  const hostname = ctx.url.hostname;
  const db = getDrizzle(ctx);

  // 1. Cek jika tenant sudah di-hardcode (Single-tenant mode / Custom Domain)
  if (env.PUBLIC_TENANT_ID) {
    const result = await db.select({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name
    })
    .from(tenants)
    .where(eq(tenants.id, env.PUBLIC_TENANT_ID))
    .limit(1);

    if (result[0]) {
      return result[0];
    }
  }

  // 2. Multi-tenant mode: Resolve by subdomain
  // baseDomain misal: ritelkit.konxc.space atau ritelkit.local
  const baseDomain = import.meta.env.DEV ? env.LOCAL_DOMAIN : (env.PUBLIC_SITE_URL.split('//')[1]?.split('/')[0] || "");
  
  if (hostname.endsWith(`.${baseDomain}`)) {
    const slug = hostname.replace(`.${baseDomain}`, "");
    if (slug && slug !== "www" && slug !== "app") {
      const result = await db.select({
        id: tenants.id,
        slug: tenants.slug,
        name: tenants.name
      })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

      if (result[0]) {
        return result[0];
      }
    }
  }

  return null;
}
