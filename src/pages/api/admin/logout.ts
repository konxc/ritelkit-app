import type { APIContext } from "astro";
import { clearSessionCookie, verifyCsrf } from "../../../lib/auth";

export async function POST(ctx: APIContext) {
    const contentType = ctx.request.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body =
        contentType.includes("application/json")
            ? await ctx.request.json()
            : Object.fromEntries(await ctx.request.formData());
    if (!verifyCsrf(ctx, body)) {
        return new Response("CSRF token tidak valid", { status: 403 });
    }
    const cookie = clearSessionCookie();
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
            Location: "/admin/login",
            "Set-Cookie": cookie,
        },
    });
}
