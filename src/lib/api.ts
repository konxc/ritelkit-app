import type { APIContext } from "astro";

export type RequestBody = Record<string, unknown>;

export async function readBody<T extends RequestBody = RequestBody>(ctx: APIContext): Promise<T> {
  const contentType = ctx.request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const parsed = await ctx.request.json();
    if (parsed && typeof parsed === "object") {
      return parsed as T;
    }
    return {} as T;
  }
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    return Object.fromEntries(await ctx.request.formData()) as T;
  }
  return {} as T;
}

export function json(data: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

export function getRequestId(ctx: APIContext) {
  return (
    ctx.request.headers.get("x-request-id") ||
    ctx.request.headers.get("cf-ray") ||
    crypto.randomUUID()
  );
}
