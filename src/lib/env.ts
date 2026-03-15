import type { APIContext } from "astro";

export type RuntimeEnv = {
  PUBLIC_SITE_URL: string;
  PUBLIC_TENANT_ID: string; // ID tenant jika ingin di-hardcode (misal: Roti Sholawat)
  LOCAL_DOMAIN: string;     // misal: ritelkit.local (untuk dev tenant detection)
  PUBLIC_WHATSAPP_NUMBER: string;
  PUBLIC_MIDTRANS_CLIENT_KEY: string;
  MIDTRANS_SERVER_KEY: string;
  PUBLIC_MIDTRANS_MERCHANT_ID: string;
  MIDTRANS_IS_PRODUCTION: string;
  DATABASE_URL: string;
  DATABASE_AUTH_TOKEN?: string;
  ADMIN_SESSION_SECRET: string;
  SETUP_TOKEN: string;
  UPLOAD_DRIVER?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
  R2_PUBLIC_BASE_URL?: string;
};

/**
 * Memastikan environment variable ada (strict validation).
 * Dilewati jika di development agar tidak menghambat setup lokal,
 * tapi akan melempar error di Production (build) jika ada yang kurang.
 */
function ensureEnv(value: string | undefined, key: string, isProduction: boolean): string {
  if (!value && isProduction) {
    throw new Error(`[Env Error] Missing critical environment variable: ${key}. Please set it in your deployment platform.`);
  }
  return value || "";
}

export function getEnv(ctx?: APIContext): RuntimeEnv {
  const runtimeEnv = ctx?.locals?.runtime?.env;
  const source = runtimeEnv ?? (typeof import.meta !== "undefined" ? import.meta.env : undefined) ?? process.env;
  
  const isProd = source.NODE_ENV === "production" || source.MIDTRANS_IS_PRODUCTION === "true";

  return {
    PUBLIC_SITE_URL: ensureEnv(source.PUBLIC_SITE_URL, "PUBLIC_SITE_URL", isProd) || "http://ritelkit.localhost:1355",
    PUBLIC_TENANT_ID: source.PUBLIC_TENANT_ID || "",
    LOCAL_DOMAIN: source.LOCAL_DOMAIN || "ritelkit.localhost",
    PUBLIC_WHATSAPP_NUMBER: ensureEnv(source.PUBLIC_WHATSAPP_NUMBER, "PUBLIC_WHATSAPP_NUMBER", isProd) || "6281234567890",
    PUBLIC_MIDTRANS_CLIENT_KEY: ensureEnv(source.PUBLIC_MIDTRANS_CLIENT_KEY, "PUBLIC_MIDTRANS_CLIENT_KEY", isProd),
    MIDTRANS_SERVER_KEY: ensureEnv(source.MIDTRANS_SERVER_KEY, "MIDTRANS_SERVER_KEY", isProd),
    PUBLIC_MIDTRANS_MERCHANT_ID: ensureEnv(source.PUBLIC_MIDTRANS_MERCHANT_ID, "PUBLIC_MIDTRANS_MERCHANT_ID", isProd),
    MIDTRANS_IS_PRODUCTION: source.MIDTRANS_IS_PRODUCTION || "false",
    DATABASE_URL: ensureEnv(source.DATABASE_URL, "DATABASE_URL", isProd) || "file:./local.db",
    DATABASE_AUTH_TOKEN: source.DATABASE_AUTH_TOKEN,
    ADMIN_SESSION_SECRET: ensureEnv(source.ADMIN_SESSION_SECRET, "ADMIN_SESSION_SECRET", isProd) || "dev-secret-placeholder",
    SETUP_TOKEN: ensureEnv(source.SETUP_TOKEN, "SETUP_TOKEN", isProd) || "dev-setup-token",
    UPLOAD_DRIVER: source.UPLOAD_DRIVER,
    R2_ACCOUNT_ID: source.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: source.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: source.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: source.R2_BUCKET,
    R2_PUBLIC_BASE_URL: source.R2_PUBLIC_BASE_URL,
  };
}

export function isProduction(ctx?: APIContext) {
  const env = getEnv(ctx);
  return env.MIDTRANS_IS_PRODUCTION === "true";
}
