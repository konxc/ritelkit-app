import type { APIContext } from "astro";
import { getDb, initDb } from "@/lib/db";
import { getEnv } from "@/lib/env";

const SESSION_COOKIE = "rs_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const PBKDF2_ITERATIONS = 120_000;
const CSRF_COOKIE = "csrf_token";

type SessionPayload = {
  email: string;
  exp: number;
};

export type AdminUserSession = {
  id: string;
  email: string;
  role: string;
};

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const base64 = btoa(binary);
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const normalized = padded + "=".repeat(padLength);
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacSign(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function createSession(ctx: APIContext, email: string) {
  const env = getEnv(ctx);
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload: SessionPayload = { email, exp };
  const payloadString = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(payloadString));
  const signature = await hmacSign(env.ADMIN_SESSION_SECRET, encodedPayload);
  const value = `${encodedPayload}.${signature}`;
  const secure = env.MIDTRANS_IS_PRODUCTION === "true";

  ctx.cookies.set(SESSION_COOKIE, value, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    secure,
  });
}

export function destroySession(ctx: APIContext) {
  ctx.cookies.delete(SESSION_COOKIE, { path: "/" });
}

async function verifySession(ctx: APIContext, value: string) {
  const env = getEnv(ctx);
  const [payloadPart, signature] = value.split(".");
  if (!payloadPart || !signature) return null;
  const expected = await hmacSign(env.ADMIN_SESSION_SECRET, payloadPart);
  if (expected !== signature) return null;
  const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadPart));
  const payload = JSON.parse(payloadJson) as SessionPayload;
  if (!payload.email || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}

export async function getAdminSession(ctx: APIContext) {
  const value = ctx.cookies.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  return verifySession(ctx, value);
}

export async function requireAdmin(ctx: APIContext) {
  await initDb(ctx);
  const session = await getAdminSession(ctx);
  if (!session) return null;
  const db = getDb(ctx);
  const result = await db.execute({
    sql: "SELECT id, email, role FROM admin_users WHERE email = ?",
    args: [session.email],
  });
  const row = result.rows[0] as
    | {
        id?: string;
        email?: string;
        role?: string;
      }
    | undefined;
  if (!row?.id || !row.email || !row.role) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
  } satisfies AdminUserSession;
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, [
    "deriveBits",
  ]);
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );
  const hash = new Uint8Array(derived);
  return `${PBKDF2_ITERATIONS}:${base64UrlEncode(salt)}:${base64UrlEncode(hash)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [iterStr, saltB64, hashB64] = stored.split(":");
  const iterations = Number(iterStr);
  if (!iterations || !saltB64 || !hashB64) return false;
  const salt = base64UrlDecode(saltB64);
  const expected = base64UrlDecode(hashB64);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, [
    "deriveBits",
  ]);
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    key,
    expected.length * 8,
  );
  const actual = new Uint8Array(derived);
  return actual.every((byte, i) => byte === expected[i]);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function sanitizeText(input: string) {
  return input.trim().replace(/\s+/g, " ");
}

export function getClientIp(ctx: APIContext) {
  return (
    ctx.request.headers.get("cf-connecting-ip") ||
    ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function getCsrfToken(ctx: APIContext) {
  return ctx.cookies.get(CSRF_COOKIE)?.value || null;
}

export function ensureCsrfToken(ctx: APIContext) {
  const existing = getCsrfToken(ctx);
  if (existing) return existing;
  const token = crypto.randomUUID();
  const env = getEnv(ctx);
  const secure = env.MIDTRANS_IS_PRODUCTION === "true";
  ctx.cookies.set(CSRF_COOKIE, token, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure,
  });
  return token;
}

export function verifyCsrf(ctx: APIContext, body?: unknown) {
  const cookie = getCsrfToken(ctx);
  if (!cookie) return false;
  const header = ctx.request.headers.get("x-csrf-token");
  if (header && header === cookie) return true;
  const bodyCsrf =
    body && typeof body === "object" && "csrf_token" in body
      ? (body as { csrf_token?: unknown }).csrf_token
      : undefined;
  if (typeof bodyCsrf === "string" && bodyCsrf === cookie) return true;
  return false;
}
