import type { APIContext } from "astro";
import { getDb } from "./db";

export type AppSettings = {
	order_settings?: {
		preorder_only?: boolean;
		minimum_lead_time_hours?: number;
		same_day_enabled?: boolean;
	};
	delivery_settings?: {
		delivery_province?: string;
		free_delivery_threshold?: number;
	};
};

export async function loadSettings(ctx: APIContext) {
	const db = getDb(ctx);
	const result = await db.execute("SELECT key, value_json FROM settings");
	const settings: AppSettings = {};
	for (const row of result.rows) {
		const key = String(row.key);
		const parsed = JSON.parse(String(row.value_json));
		if (key === "order_settings") settings.order_settings = parsed;
		if (key === "delivery_settings") settings.delivery_settings = parsed;
	}
	return settings;
}
