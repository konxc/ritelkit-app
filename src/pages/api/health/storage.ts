import type { APIContext } from "astro";
import { getEnv } from "../../../lib/env";
import { json } from "../../../lib/api";
import { isCloudflare, isNodeLike } from "../../../lib/runtime";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function POST(ctx: APIContext) {
    const env = getEnv(ctx);
    const key = `health-${Date.now()}.txt`;
    const content = "health-check";

    if (env.UPLOAD_DRIVER === "r2" || isCloudflare(ctx)) {
        if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
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
                Key: key,
                Body: content,
                ContentType: "text/plain",
            })
        );
        await client.send(
            new DeleteObjectCommand({
                Bucket: env.R2_BUCKET,
                Key: key,
            })
        );
        return json({ ok: true, driver: "r2", key });
    }

    if (!isNodeLike()) {
        return new Response("Storage test tidak tersedia di runtime ini", {
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
