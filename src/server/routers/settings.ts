import { adminProcedure, router } from "@/server/trpc";
import { settings } from "@/db/schema";

import { z } from "zod";
import { logAudit } from "@/lib/admin";

export const settingsRouter = router({
  get: adminProcedure.query(async ({ ctx }) => {
    const all = await ctx.db.select().from(settings);
    const result: Record<string, any> = {};
    for (const s of all) {
      result[s.key] = JSON.parse(s.valueJson);
    }
    return result;
  }),

  update: adminProcedure
    .input(
      z.object({
        orderSettings: z.any().optional(),
        deliverySettings: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const keys = Object.keys(input) as (keyof typeof input)[];
      for (const key of keys) {
        const val = input[key];
        if (val !== undefined) {
          const dbKey = key === "orderSettings" ? "order_settings" : "delivery_settings";
          await ctx.db
            .insert(settings)
            .values({
              key: dbKey,
              valueJson: JSON.stringify(val),
              updatedAt: new Date().toISOString(),
            })
            .onConflictDoUpdate({
              target: settings.key,
              set: {
                valueJson: JSON.stringify(val),
                updatedAt: new Date().toISOString(),
              },
            });
        }
      }
      await logAudit(ctx.ctx, "update_settings", "settings", undefined, input);
      return { ok: true };
    }),
});
