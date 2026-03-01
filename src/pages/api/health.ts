import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIContext } from "astro";
import { json } from "../../lib/api";
import { getAdminSession } from "../../lib/auth";
import { getDb, initDb } from "../../lib/db";
import { getEnv } from "../../lib/env";
import { runtimeName } from "../../lib/runtime";

export async function GET(ctx: APIContext) {
  const env = getEnv(ctx);
  const url = new URL(ctx.request.url);
  const deep = url.searchParams.get("deep") === "1";
  const deepExternal = url.searchParams.get("deep") === "2";
  const authCheck = url.searchParams.get("auth") === "1";
  const response: Record<string, unknown> = {
    ok: true,
    runtime: runtimeName(ctx),
    adapter: process.env.ASTRO_ADAPTER || "auto",
    upload_driver: env.UPLOAD_DRIVER || "auto",
  };

  if (deep || deepExternal) {
    const checks: Record<string, unknown> = {};
    try {
      await initDb(ctx);
      const db = getDb(ctx);
      const start = Date.now();
      const result = await db.execute("SELECT 1 as ok");
      const durationMs = Date.now() - start;
      checks.db = result.rows?.[0]?.ok === 1 ? "ok" : "unknown";
      checks.db_latency_ms = durationMs;
    } catch (err: any) {
      checks.db = "error";
      checks.db_error = err?.message || String(err);
      response.ok = false;
    }

    if (env.UPLOAD_DRIVER === "r2") {
      try {
        if (
          !env.R2_ACCOUNT_ID ||
          !env.R2_ACCESS_KEY_ID ||
          !env.R2_SECRET_ACCESS_KEY ||
          !env.R2_BUCKET
        ) {
          throw new Error("R2 env belum lengkap");
        }
        const client = new S3Client({
          region: "auto",
          endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
          },
        });
        const start = Date.now();
        await client.send(new HeadBucketCommand({ Bucket: env.R2_BUCKET }));
        const durationMs = Date.now() - start;
        checks.r2 = "ok";
        checks.r2_latency_ms = durationMs;
      } catch (err: any) {
        checks.r2 = "error";
        checks.r2_error = err?.message || String(err);
        response.ok = false;
      }
    }
    if (deepExternal) {
      try {
        const orderNo = `health-${Date.now()}`;
        const grossAmount = 1000;
        const auth = btoa(`${env.MIDTRANS_SERVER_KEY}:`);
        const base =
          env.MIDTRANS_IS_PRODUCTION === "true"
            ? "https://app.midtrans.com"
            : "https://app.sandbox.midtrans.com";
        const start = Date.now();
        const res = await fetch(`${base}/snap/v1/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            transaction_details: {
              order_id: orderNo,
              gross_amount: grossAmount,
            },
          }),
        });
        const durationMs = Date.now() - start;
        checks.midtrans = res.ok ? "ok" : "error";
        checks.midtrans_status = res.status;
        checks.midtrans_latency_ms = durationMs;
        if (!res.ok) response.ok = false;
      } catch (err: any) {
        checks.midtrans = "error";
        checks.midtrans_error = err?.message || String(err);
        response.ok = false;
      }
    }
    response.checks = checks;
  }

  if (authCheck) {
    const session = await getAdminSession(ctx);
    response.auth = session ? "ok" : "unauthorized";
    if (!session) response.ok = false;
  }

  if (deep && url.searchParams.get("write") === "1") {
    try {
      await initDb(ctx);
      const db = getDb(ctx);
      await db.execute({
        sql: "CREATE TABLE IF NOT EXISTS health_write_test (id TEXT PRIMARY KEY, created_at TEXT NOT NULL)",
      });
      await db.execute({
        sql: "INSERT INTO health_write_test (id, created_at) VALUES (?, ?)",
        args: [crypto.randomUUID(), new Date().toISOString()],
      });
      response.db_write = "ok";
    } catch (err: any) {
      response.db_write = "error";
      response.db_write_error = err?.message || String(err);
      response.ok = false;
    }
  }

  return json(response);
}
