import { adminProcedure, router } from "@server/trpc";
import { refunds, orders, orderStatusHistory } from "@db/schema";
import { desc, eq, sql, like, and, inArray } from "drizzle-orm";
import { z } from "zod";

export const refundRouter = router({
  list: adminProcedure
    .input(
      z.object({
        q: z.string().optional(),
        status: z.array(z.string()).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { q, status, limit, offset } = input;
      const whereClause = [];
      if (q) {
        whereClause.push(like(refunds.orderNo, `%${q}%`));
      }
      if (status && status.length > 0) {
        whereClause.push(inArray(refunds.status, status));
      }

      const baseQuery = ctx.db.select().from(refunds);
      const finalQuery = whereClause.length > 0 ? baseQuery.where(and(...whereClause)) : baseQuery;

      const rows = await finalQuery.orderBy(desc(refunds.createdAt)).limit(limit).offset(offset);

      const countQuery = ctx.db.select({ count: sql<number>`count(*)` }).from(refunds);
      const finalCountQuery = whereClause.length > 0 ? countQuery.where(and(...whereClause)) : countQuery;

      const totalRes = await finalCountQuery;

      return {
        rows,
        total: totalRes[0]?.count || 0,
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

      await ctx.db.transaction(async (tx) => {
        // 1. Insert refund record
        await tx.insert(refunds).values({
          id,
          orderId: input.orderId,
          orderNo: input.orderNo,
          amount: input.amount,
          status: input.status,
          reason: input.reason || null,
          createdAt: now,
          updatedAt: now,
        });

        // 2. Update order payment status to refunded
        await tx.update(orders).set({ paymentStatus: "refunded", updatedAt: now }).where(eq(orders.id, input.orderId));

        // 3. Log to history
        await tx.insert(orderStatusHistory).values({
          id: crypto.randomUUID(),
          orderId: input.orderId,
          status: "refunded",
          notes: `Refund dibuat sebesar Rp${input.amount.toLocaleString()}. Alasan: ${input.reason || "-"}`,
          createdAt: now,
        });
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
