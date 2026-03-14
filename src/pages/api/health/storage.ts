import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIContext } from "astro";
import { json } from "@/lib/api";
import { getEnv } from "@/lib/env";
import { isCloudflare, isNodeLike } from "@/lib/runtime";

export async function POST(ctx: APIContext) {
  const env = getEnv(ctx);
  const key = `health-${Date.now()}.txt`;
  const content = "health-check";

  if (env.UPLOAD_DRIVER === "r2" || isCloudflare(ctx)) {
    if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
      return new Response("R2 env is not fully configured", { status: 500 });
    }
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: content,
        ContentType: "text/plain",
      }),
    );
    await client.send(
      new DeleteObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
      }),
    );
    return json({ ok: true, driver: "r2", key });
  }

  if (!isNodeLike()) {
    return new Response("Storage test is not available in this runtime", {
      status: 500,
    });
  }
  const { writeFile, unlink } = await import("node:fs/promises");
  const path = await import("node:path");
  const filePath = path.join(process.cwd(), "public", "uploads", key);
  await writeFile(filePath, content, "utf8");
  await unlink(filePath);
  return json({ ok: true, driver: "local", key });
}
