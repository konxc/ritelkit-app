import type { APIContext } from "astro";

export function isCloudflare(ctx?: APIContext) {
  return Boolean(ctx?.locals?.runtime?.cf);
}

export function isNodeLike() {
  return (
    typeof process !== "undefined" &&
    !!process.versions &&
    (process.versions.node || process.versions.bun)
  );
}

export function runtimeName(ctx?: APIContext) {
  if (isCloudflare(ctx)) return "cloudflare";
  if (isNodeLike()) return "node";
  return "unknown";
}
