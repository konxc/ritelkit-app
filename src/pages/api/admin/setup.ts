import type { APIContext } from "astro";
import { getEnv } from "../../../lib/env";
import { getDb, initDb } from "../../../lib/db";
import { hashPassword, normalizeEmail, sanitizeText, verifyCsrf } from "../../../lib/auth";
import { nowIso } from "../../../lib/utils";

export async function GET() {
    return new Response(null, {
        status: 302,
        headers: { Location: "/admin/setup" },
    });
}

export async function POST(ctx: APIContext) {
    await initDb(ctx);
    const env = getEnv(ctx);
    const contentType = ctx.request.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body =
        contentType.includes("application/json")
            ? await ctx.request.json()
            : Object.fromEntries(await ctx.request.formData());

    if (!verifyCsrf(ctx, body)) {
        if (isJson) {
            return new Response("CSRF token tidak valid. Gunakan form /admin/setup.", {
                status: 403,
            });
        }
        return new Response(null, {
            status: 303,
            headers: { Location: "/admin/setup?error=csrf" },
        });
    }

    const setupToken = sanitizeText(String((body as any).setup_token || ""));
    if (!env.SETUP_TOKEN) {
        if (isJson) {
            return new Response("SETUP_TOKEN belum diset di env", { status: 500 });
        }
        return new Response(null, {
            status: 303,
            headers: { Location: "/admin/setup?error=missing" },
        });
    }
    if (setupToken !== env.SETUP_TOKEN) {
        if (isJson) {
            return new Response("Setup token tidak valid. Gunakan token dari env SETUP_TOKEN.", {
                status: 403,
            });
        }
        return new Response(null, {
            status: 303,
            headers: { Location: "/admin/setup?error=token" },
        });
    }

    const db = getDb(ctx);
    const existing = await db.execute("SELECT COUNT(*) as count FROM admin_users");
    const count = Number((existing.rows[0] as any)?.count || 0);
    if (count > 0) {
        if (isJson) {
            return new Response("Admin sudah tersedia", { status: 400 });
        }
        return new Response(null, {
            status: 303,
            headers: { Location: "/admin/login?info=exists" },
        });
    }

    const email = normalizeEmail(String((body as any).email || ""));
    const password = sanitizeText(String((body as any).password || ""));
    if (!email || password.length < 8) {
        if (isJson) {
            return new Response("Email atau password tidak valid", { status: 400 });
        }
        return new Response(null, {
            status: 303,
            headers: { Location: "/admin/setup?error=invalid" },
        });
    }

    const passwordHash = await hashPassword(password);
    await db.execute({
        sql: "INSERT INTO admin_users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
        args: [crypto.randomUUID(), email, passwordHash, nowIso()],
    });

    if (isJson) {
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }
    return new Response(null, {
        status: 303,
        headers: { Location: "/admin/login?success=1" },
    });
}
