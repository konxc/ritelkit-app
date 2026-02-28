import fs from "node:fs";
import path from "node:path";

async function loadPlaywright() {
	try {
		const { chromium } = await import("playwright");
		return chromium;
	} catch (err) {
		console.error(
			"\n[error] Playwright is not installed. Install first: pnpm dlx playwright install --with-deps\n",
		);
		throw err;
	}
}

async function run() {
	const chromium = await loadPlaywright();
	const browser = await chromium.launch({
		headless: true,
		chromiumSandbox: false,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
			"--disable-gpu",
			"--single-process",
			"--no-zygote",
		],
	});
	const context = await browser.newContext({
		viewport: { width: 1280, height: 720 },
	});
	const mobile = await browser.newContext({
		viewport: { width: 430, height: 932 },
		userAgent:
			"Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true,
	});

	const pages = ["v0", "v1", "v2", "v3"];
	const outDir = path.resolve("screenshots");
	fs.mkdirSync(outDir, { recursive: true });

	for (const slug of pages) {
		const url = `http://localhost:4321/research/${slug}`;
		console.log("capture", url);

		const pageDesktop = await context.newPage();
		await pageDesktop.goto(url, { waitUntil: "networkidle" });
		await pageDesktop.waitForTimeout(600); // allow animations
		await pageDesktop.screenshot({
			path: path.join(outDir, `${slug}-desktop.png`),
			fullPage: true,
		});
		await pageDesktop.close();

		const pageMobile = await mobile.newPage();
		await pageMobile.goto(url, { waitUntil: "networkidle" });
		await pageMobile.waitForTimeout(600);
		await pageMobile.screenshot({
			path: path.join(outDir, `${slug}-mobile.png`),
			fullPage: true,
		});
		await pageMobile.close();
	}

	await browser.close();
	console.log("\nDone. Screenshots saved in", outDir);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
