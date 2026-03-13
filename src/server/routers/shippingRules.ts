import { adminProcedure, router } from "../trpc";
import { shippingRules } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const shippingRuleRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(shippingRules).orderBy(desc(shippingRules.priority));
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.string(),
        priority: z.number().default(100),
        config: z
          .union([
            z.object({
              type: z.literal("flat"),
              flatFee: z.number().optional(),
              thresholdAmount: z.number().optional(),
            }),
            z.object({
              type: z.literal("free_above"),
              thresholdAmount: z.number().optional(),
              flatFee: z.number().optional(),
            }),
            z.object({ type: z.literal("weight_based") }),
            z.record(z.unknown()),
          ])
          .optional(),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await ctx.db.insert(shippingRules).values({
        id,
        name: input.name,
        type: input.type,
        priority: input.priority,
        configJson: JSON.stringify(input.config),
        isActive: input.isActive ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      });
      return { id };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          type: z.string().optional(),
          priority: z.number().optional(),
          config: z
            .union([
              z.object({
                type: z.literal("flat"),
                flatFee: z.number().optional(),
                thresholdAmount: z.number().optional(),
              }),
              z.object({
                type: z.literal("free_above"),
                thresholdAmount: z.number().optional(),
                flatFee: z.number().optional(),
              }),
              z.object({ type: z.literal("weight_based") }),
              z.record(z.unknown()),
            ])
            .optional(),
          isActive: z.boolean().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const updateData: any = { ...input.data, updatedAt: now };
      if (input.data.config) {
        updateData.configJson = JSON.stringify(input.data.config);
        delete updateData.config;
      }
      if (input.data.isActive !== undefined) {
        updateData.isActive = input.data.isActive ? 1 : 0;
      }

      await ctx.db.update(shippingRules).set(updateData).where(eq(shippingRules.id, input.id));
      return { ok: true };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(shippingRules).where(eq(shippingRules.id, input));
    return { ok: true };
  }),
});
