import { adminProcedure, router } from "@server/trpc";
import { orders, orderStatusHistory } from "@db/schema";
import { OrderSchema } from "@lib/types";
import { eq, desc, asc, like, or, inArray, sql } from "drizzle-orm";
import { logAudit } from "@lib/admin";

import { z } from "zod";

export const orderRouter = router({
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
        whereClause.push(
          or(like(orders.orderNo, `%${q}%`), like(orders.customerName, `%${q}%`), like(orders.customerPhone, `%${q}%`)),
        );
      }
      if (status && status.length > 0) {
        whereClause.push(inArray(orders.status, status));
      }

      const baseQuery = ctx.db.select().from(orders);
      const finalQuery =
        whereClause.length > 0 ? baseQuery.where(sql`${sql.join(whereClause, sql` AND `)}`) : baseQuery;

      const rows = await finalQuery.orderBy(desc(orders.createdAt)).limit(limit).offset(offset);

      // Get total count for pagination
      const countQuery = ctx.db.select({ count: sql<number>`count(*)` }).from(orders);
      const finalCountQuery =
        whereClause.length > 0 ? countQuery.where(sql`${sql.join(whereClause, sql` AND `)}`) : countQuery;

      const countResult = await finalCountQuery;
      const total = Number(countResult[0]?.count || 0);

      return {
        rows,
        total,
        totalPages: Math.ceil(total / limit),
      };
    }),

  fulfillment: adminProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select()
        .from(orders)
        .where(inArray(orders.status, ["pending", "processing"]))
        .orderBy(asc(orders.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  get: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const result = await ctx.db.select().from(orders).where(eq(orders.orderNo, input));
    return result[0];
  }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: OrderSchema.partial().omit({ id: true, createdAt: true, updatedAt: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();

      await ctx.db.transaction(async (tx) => {
        // 1. Get original order to see if status changed
        const originalOrder = await tx
          .select({ status: orders.status })
          .from(orders)
          .where(eq(orders.id, input.id))
          .get();

        // 2. Update order
        await tx
          .update(orders)
          .set({ ...(input.data as any), updatedAt: now })
          .where(eq(orders.id, input.id));

        // 3. If status changed, log to history
        const status = (input.data as any).status;
        if (originalOrder && status && originalOrder.status !== status) {
          await tx.insert(orderStatusHistory).values({
            id: crypto.randomUUID(),
            orderId: input.id,
            status: status,
            notes: (input.data as any).notes || "Status updated via Admin Dashboard",
            createdAt: now,
          });
        }
      });

      await logAudit(ctx.ctx, "update_order", "order", input.id, input.data);
      return { ok: true };
    }),

  create: adminProcedure
    .input(OrderSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newOrder = {
        ...input,
        id,
        createdAt: now,
        updatedAt: now,
      };
      await ctx.db.insert(orders).values(newOrder as any);
      await logAudit(ctx.ctx, "create_order", "order", id, newOrder);
      return { id };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(orders).where(eq(orders.id, input));
    await logAudit(ctx.ctx, "delete_order", "order", input, null);
    return { ok: true };
  }),
});
