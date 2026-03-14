type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface Env {
  PUBLIC_SITE_URL: string;
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
}

interface ImportMetaEnv extends Env {}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals extends Runtime {
    session: import("./lib/auth").AdminUserSession | null;
    user: import("./lib/auth").AdminUserSession | null; // Pada app ini user = session info
    tenant: import("./lib/tenant-resolver").TenantInfo | null;
  }
}
