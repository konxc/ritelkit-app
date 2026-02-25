import type { APIContext } from "astro";
import { createSessionCookie, normalizeEmail, sanitizeText, verifyCsrf, getClientIp, verifyPassword } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";

export async function POST(ctx: APIContext) {
    await initDb(ctx);
    const contentType = ctx.request.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = (contentType.includes("application/json")
        ? await ctx.request.json()
        : Object.fromEntries(await ctx.request.formData())) as any;

    if (!verifyCsrf(ctx, body)) {
        if (isJson) {
            return new Response("CSRF token tidak valid", { status: 403 });
        }
        return new Response(null, {
            status: 303,
            headers: { Location: "/admin/login?error=csrf" },
        });
    }

    const email = normalizeEmail(String(body.email || ""));
    const password = sanitizeText(String(body.password || ""));

    if (!email || !password) {
        if (isJson) {
            return new Response("Email dan password wajib diisi", { status: 400 });
        }
        return new Response(null, {
            status: 303,
            headers: { Location: "/admin/login?error=invalid" },
        });
    }

    const db = getDb(ctx);
    const ip = getClientIp(ctx);
    const nowSec = Math.floor(Date.now() / 1000);
    const limitWindow = nowSec - 10 * 60;
    const attemptRes = await db.execute({
        sql: "SELECT COUNT(*) as count FROM login_attempts WHERE ip = ? AND created_at >= ?",
        args: [ip, limitWindow],
    });
    const attempts = Number(attemptRes.rows[0]?.count || 0);
    if (attempts >= 5) {
        if (isJson) {
            return new Response("Terlalu banyak percobaan, coba lagi nanti", {
                status: 429,
            });
        }
        return new Response(null, {
            status: 303,
            headers: { Location: "/admin/login?error=rate" },
        });
    }

    const result = await db.execute({
        sql: "SELECT password_hash FROM admin_users WHERE email = ?",
        args: [email],
    });
    const row = result.rows[0] as { password_hash?: string } | undefined;
    if (!row?.password_hash) {
        await db.execute({
            sql: "INSERT INTO login_attempts (id, ip, created_at) VALUES (?, ?, ?)",
            args: [crypto.randomUUID(), ip, nowSec],
        });
        if (isJson) {
            return new Response("Email atau password salah", { status: 401 });
        }
        return new Response(null, {
            status: 303,
            headers: { Location: "/admin/login?error=invalid" },
        });
    }

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) {
        await db.execute({
            sql: "INSERT INTO login_attempts (id, ip, created_at) VALUES (?, ?, ?)",
            args: [crypto.randomUUID(), ip, nowSec],
        });
        if (isJson) {
            return new Response("Email atau password salah", { status: 401 });
        }
        return new Response(null, {
            status: 303,
            headers: { Location: "/admin/login?error=invalid" },
        });
    }
    await db.execute({
        sql: "INSERT INTO login_attempts (id, ip, created_at) VALUES (?, ?, ?)",
        args: [crypto.randomUUID(), ip, nowSec],
    });

    const cookie = await createSessionCookie(ctx, email);
    if (isJson) {
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Set-Cookie": cookie,
            },
        });
    }
    return new Response(null, {
        status: 303,
        headers: {
            Location: "/admin/overview",
            "Set-Cookie": cookie,
        },
    });
}
