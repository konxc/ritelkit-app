import { chromium } from "playwright";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:4321";
const ROUTES = (
  process.env.SMOKE_ROUTES ??
  "/admin/katalog,/admin/pesanan,/admin/pemasaran,/admin/settings,/admin/sistem"
)
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);

function isIgnorable(message) {
  return (
    message.includes("favicon.ico") ||
    message.includes("404 (Not Found)") ||
    message.includes("Manifest")
  );
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    chromiumSandbox: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });

  let hasFailure = false;

  for (const route of ROUTES) {
    const url = `${BASE_URL}${route}`;
    const page = await context.newPage();
    const routeErrors = [];

    page.on("pageerror", (err) => {
      routeErrors.push(`pageerror: ${err.message}`);
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!isIgnorable(text)) routeErrors.push(`console: ${text}`);
      }
    });

    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(700);
      const status = response?.status() ?? 0;

      if (status >= 500) {
        routeErrors.push(`http: ${status}`);
      }
    } catch (err) {
      routeErrors.push(`navigation: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (routeErrors.length > 0) {
      hasFailure = true;
      console.error(`\n[FAIL] ${url}`);
      for (const error of routeErrors) console.error(`- ${error}`);
    } else {
      console.log(`[PASS] ${url}`);
    }

    await page.close();
  }

  await context.close();
  await browser.close();

  if (hasFailure) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
