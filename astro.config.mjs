// @ts-check

import cloudflare from "@astrojs/cloudflare";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
const adapterOverride = process.env.ASTRO_ADAPTER;
const isCloudflare = adapterOverride === "cloudflare" || !!process.env.CF_PAGES;
const isNode = adapterOverride === "node" || !!process.env.DOCKER || !!process.env.NODE_RUNTIME;

let selectedAdapter;
if (isNode && !isCloudflare) {
  const dynamicImport = new Function("m", "return import(m)");
  const nodeModule = await dynamicImport("@astrojs/node");
  selectedAdapter = nodeModule.default({ mode: "standalone" });
} else {
  selectedAdapter = cloudflare({
    imageService: "compile",
  });
}

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://ritelkit.konxc.space",
  output: "server",
  integrations: [svelte(), partytown(), sitemap()],
  adapter: selectedAdapter,
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["@tanstack/svelte-query", "@trpc/server", "@trpc/client"],
      external: [
        "zlib",
        "fs",
        "events",
        "stream",
        "buffer",
        "util",
        "url",
        "path",
        "crypto",
        "async_hooks",
        "node:path",
        "node:crypto",
        "node:fs/promises",
        "node:fs",
        "node:buffer",
        "node:stream",
        "node:util",
        "node:url",
        "node:async_hooks",
      ],
    },
  },
});
