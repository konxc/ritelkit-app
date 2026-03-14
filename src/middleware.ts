import type { MiddlewareHandler } from "astro";
import { resolveTenant } from "./lib/tenant-resolver";
import { requireAdmin } from "@lib/auth";

export const onRequest: MiddlewareHandler = async (context, next) => {
  const pathname = context.url.pathname;
  
  // 1. Resolve Tenant
  const tenant = await resolveTenant(context);
  context.locals.tenant = tenant;

  // 2. Auth Injection (Gunakan requireAdmin untuk fetch full info jika ada session)
  const session = await requireAdmin(context);
  context.locals.session = session;
  context.locals.user = session;

  const response = await next();
  const headers = new Headers(response.headers);

  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join("; "),
  );
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "same-origin");
  headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
