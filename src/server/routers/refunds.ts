import { adminProcedure, router } from "../trpc";
import { refunds } from "../../db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const refundRouter = router({
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const data = await ctx.db
        .select()
        .from(refunds)
        .orderBy(desc(refunds.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      const totalResult = await ctx.db.select({ count: refunds.id }).from(refunds);
      return {
        rows: data,
        total: totalResult.length,
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        orderNo: z.string(),
        orderId: z.string(),
        amount: z.number(),
        status: z.string(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await ctx.db.insert(refunds).values({
        id,
        orderId: input.orderId,
        orderNo: input.orderNo,
        amount: input.amount,
        status: input.status,
        reason: input.reason || null,
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
          amount: z.number().optional(),
          status: z.string().optional(),
          reason: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      await ctx.db
        .update(refunds)
        .set({
          ...input.data,
          updatedAt: now,
        })
        .where(eq(refunds.id, input.id));
      return { ok: true };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(refunds).where(eq(refunds.id, input));
    return { ok: true };
  }),
});
