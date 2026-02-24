import type { APIContext } from "astro";

export type RuntimeEnv = {
    PUBLIC_SITE_URL: string;
    PUBLIC_WHATSAPP_NUMBER: string;
    PUBLIC_MIDTRANS_CLIENT_KEY: string;
    MIDTRANS_SERVER_KEY: string;
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

export function getEnv(ctx?: APIContext): RuntimeEnv {
    const runtimeEnv = ctx?.locals?.runtime?.env;
    const source = runtimeEnv ?? import.meta.env;

    return {
        PUBLIC_SITE_URL: source.PUBLIC_SITE_URL,
        PUBLIC_WHATSAPP_NUMBER: source.PUBLIC_WHATSAPP_NUMBER,
        PUBLIC_MIDTRANS_CLIENT_KEY: source.PUBLIC_MIDTRANS_CLIENT_KEY,
        MIDTRANS_SERVER_KEY: source.MIDTRANS_SERVER_KEY,
        MIDTRANS_IS_PRODUCTION: source.MIDTRANS_IS_PRODUCTION,
        DATABASE_URL: source.DATABASE_URL,
        DATABASE_AUTH_TOKEN: source.DATABASE_AUTH_TOKEN,
        ADMIN_SESSION_SECRET: source.ADMIN_SESSION_SECRET,
        SETUP_TOKEN: source.SETUP_TOKEN,
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
