import type { MiddlewareHandler } from "astro";
import { resolveTenant } from "./lib/tenant-resolver";
import { requireAdmin } from "@lib/auth";
import { getEnv } from "./lib/env";

const STATIC_ASSETS = ["/_", ".js", ".css", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".woff", ".woff2"];

export const onRequest: MiddlewareHandler = async (context, next) => {
  const pathname = context.url.pathname;
  const hostname = context.url.hostname;
  const env = getEnv(context);

  // Skip middleware for static assets
  if (STATIC_ASSETS.some(ext => pathname.includes(ext)) || pathname.startsWith("/_astro")) {
    return next();
  }

  // 1. Handle Landing Site (ritelkit.localhost) Proxy
  // Jika akses ke domain utama ritelkit.localhost, kita ambil konten dari ritelkit-site
  if (import.meta.env.DEV && hostname === "ritelkit.localhost") {
    try {
      const targetUrl = new URL(pathname + context.url.search, "http://localhost:4322");
      const response = await fetch(targetUrl.toString());
      const body = await response.arrayBuffer();
      return new Response(body, {
        status: response.status,
        headers: response.headers
      });
    } catch (e) {
      return new Response("Landing site (ritelkit-site) is not running on port 4322. Please run ./dev.sh", { status: 503 });
    }
  }

  // 2. Resolve Tenant
  const tenant = await resolveTenant(context);
  context.locals.tenant = tenant;

  // 3. Domain Context Enforcement
  // Jika akses app.ritelkit tapi tidak di rute /admin (kecuali login/api/assets)
  if (hostname.startsWith("app.")) {
    if (pathname === "/" || (!pathname.startsWith("/admin") && !pathname.startsWith("/api") && !pathname.startsWith("/login"))) {
      // Redirect root app.ritelkit ke /admin
      if (pathname === "/") return context.redirect("/admin");
    }
  }

  // 4. Auth Injection
  const session = await requireAdmin(context);
  context.locals.session = session;
  context.locals.user = session;

  return next();
};
