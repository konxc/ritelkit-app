import { adminProcedure, router } from "@server/trpc";
import { shipments, orders, orderStatusHistory } from "@db/schema";
import { eq, desc, sql, or, like, inArray } from "drizzle-orm";
import { z } from "zod";

export const shipmentRouter = router({
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
        whereClause.push(or(like(shipments.orderNo, `%${q}%`), like(shipments.trackingNo || "", `%${q}%`)));
      }
      if (status && status.length > 0) {
        whereClause.push(inArray(shipments.status, status));
      }

      const baseQuery = ctx.db.select().from(shipments);
      const finalQuery =
        whereClause.length > 0 ? baseQuery.where(sql`${sql.join(whereClause, sql` AND `)}`) : baseQuery;

      const rows = await finalQuery.orderBy(desc(shipments.createdAt)).limit(limit).offset(offset);

      const countQuery = ctx.db.select({ count: sql<number>`count(*)` }).from(shipments);
      const finalCountQuery =
        whereClause.length > 0 ? countQuery.where(sql`${sql.join(whereClause, sql` AND `)}`) : countQuery;

      const totalRes = await finalCountQuery;

      return {
        rows,
        total: totalRes[0]?.count || 0,
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        orderId: z.string(),
        orderNo: z.string(),
        status: z.string(), // initial tracking status (packing, shipped, etc)
        carrier: z.string().optional(),
        trackingNo: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await ctx.db.transaction(async (tx) => {
        // 1. Create shipment record
        await tx.insert(shipments).values({
          id,
          orderId: input.orderId,
          orderNo: input.orderNo,
          status: input.status,
          carrier: input.carrier || null,
          trackingNo: input.trackingNo || null,
          notes: input.notes || null,
          createdAt: now,
          updatedAt: now,
        });

        // 2. If status is 'shipped' or 'delivered', update the order status
        if (input.status === "shipped" || input.status === "delivered") {
          await tx.update(orders).set({ status: input.status, updatedAt: now }).where(eq(orders.id, input.orderId));

          await tx.insert(orderStatusHistory).values({
            id: crypto.randomUUID(),
            orderId: input.orderId,
            status: input.status,
            notes: `Auto-updated via Shipment Tracking (${input.carrier || "Kurir"})`,
            createdAt: now,
          });
        }
      });

      return { id };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          status: z.string().optional(),
          carrier: z.string().optional(),
          trackingNo: z.string().optional(),
          notes: z.string().optional(),
          shippedAt: z.string().optional(),
          deliveredAt: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      await ctx.db
        .update(shipments)
        .set({ ...input.data, updatedAt: now })
        .where(eq(shipments.id, input.id));
      return { ok: true };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(shipments).where(eq(shipments.id, input));
    return { ok: true };
  }),
});
