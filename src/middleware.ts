import type { MiddlewareHandler } from "astro";
import { resolveTenant } from "./lib/tenant-resolver";
import { requireAdmin } from "@lib/auth";

const STATIC_ASSETS = ["/_", ".js", ".css", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".woff", ".woff2"];

export const onRequest: MiddlewareHandler = async (context, next) => {
  const pathname = context.url.pathname;

  // Skip middleware for static assets to improve performance
  if (STATIC_ASSETS.some(ext => pathname.includes(ext))) {
    return next();
  }
  
  // 1. Resolve Tenant
  const tenant = await resolveTenant(context);
  context.locals.tenant = tenant;

  // 2. Auth Injection (Gunakan requireAdmin untuk fetch full info jika ada session)
  const session = await requireAdmin(context);
  context.locals.session = session;
  context.locals.user = session;

  return next();
};
