import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIContext } from "astro";
import { json } from "../../../lib/api";
import { requireAdmin, verifyCsrf } from "../../../lib/auth";
import { initDb } from "../../../lib/db";
import { getEnv } from "../../../lib/env";
import { isCloudflare, isNodeLike } from "../../../lib/runtime";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  if (!verifyCsrf(ctx)) {
    return new Response("CSRF token tidak valid", { status: 403 });
  }

  const formData = await ctx.request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return new Response("File tidak valid", { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response("Tipe file tidak didukung", { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return new Response("File terlalu besar (max 5MB)", { status: 400 });
  }

  const env = getEnv(ctx);
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const isNode = isNodeLike();
  const buffer = isNode ? Buffer.from(arrayBuffer) : new Uint8Array(arrayBuffer);
  let outputBuffer: Uint8Array | Buffer = buffer;
  let outputName = filename;
  let outputType = file.type;

  if (isNode) {
    try {
      const { default: sharp } = await import("sharp");
      outputBuffer = await sharp(buffer as Buffer)
        .resize({ width: 1600, height: 1600, fit: "inside" })
        .webp({ quality: 82 })
        .toBuffer();
      outputName = filename.replace(/\.\w+$/, ".webp");
      outputType = "image/webp";
    } catch {
      // If sharp not available, fallback to original buffer
    }
  }

  if (env.UPLOAD_DRIVER === "r2" || isCloudflare(ctx)) {
    if (
      !env.R2_ACCOUNT_ID ||
      !env.R2_ACCESS_KEY_ID ||
      !env.R2_SECRET_ACCESS_KEY ||
      !env.R2_BUCKET
    ) {
      return new Response("R2 env belum lengkap", { status: 500 });
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
        Key: outputName,
        Body: outputBuffer,
        ContentType: outputType,
      }),
    );
    const baseUrl = env.R2_PUBLIC_BASE_URL || "";
    const url = baseUrl ? `${baseUrl}/${outputName}` : outputName;
    return json({ ok: true, url });
  }

  if (!isNodeLike()) {
    return new Response("Upload local hanya tersedia di node/bun", {
      status: 500,
    });
  }
  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, outputName), outputBuffer);
  return json({ ok: true, url: `/uploads/${outputName}` });
}
