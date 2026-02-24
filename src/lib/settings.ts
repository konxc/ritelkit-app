import type { APIContext } from "astro";
import { getDb } from "./db";

export async function loadSettings(ctx: APIContext) {
    const db = getDb(ctx);
    const result = await db.execute("SELECT key, value_json FROM settings");
    const settings: Record<string, any> = {};
    for (const row of result.rows) {
        settings[String(row.key)] = JSON.parse(String(row.value_json));
    }
    return settings;
}
