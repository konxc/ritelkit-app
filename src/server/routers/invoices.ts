import { adminProcedure, router } from "@server/trpc";
import { invoices, orders } from "@db/schema";
import { eq, desc, sql, or, like, and, inArray } from "drizzle-orm";
import { z } from "zod";

export const invoiceRouter = router({
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
        whereClause.push(or(like(invoices.invoiceNo, `%${q}%`), like(orders.orderNo, `%${q}%`)));
      }
      if (status && status.length > 0) {
        whereClause.push(inArray(invoices.status, status));
      }

      const baseQuery = ctx.db
        .select({
          id: invoices.id,
          invoiceNo: invoices.invoiceNo,
          status: invoices.status,
          issuedAt: invoices.issuedAt,
          dueAt: invoices.dueAt,
          orderNo: orders.orderNo,
        })
        .from(invoices)
        .innerJoin(orders, eq(orders.id, invoices.orderId));

      const finalQuery = whereClause.length > 0 ? baseQuery.where(and(...whereClause)) : baseQuery;

      const rows = await finalQuery.orderBy(desc(invoices.createdAt)).limit(limit).offset(offset);

      const countQuery = ctx.db.select({ count: sql<number>`count(*)` }).from(invoices);
      const finalCountQuery =
        whereClause.length > 0
          ? countQuery.innerJoin(orders, eq(orders.id, invoices.orderId)).where(and(...whereClause))
          : countQuery;

      const totalRes = await finalCountQuery;

      return {
        rows,
        total: totalRes[0]?.count || 0,
      };
    }),
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          status: z.string().optional(),
          dueAt: z.string().optional().nullable(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      await ctx.db
        .update(invoices)
        .set({
          ...input.data,
          updatedAt: now,
        })
        .where(eq(invoices.id, input.id));
      return { ok: true };
    }),
});
