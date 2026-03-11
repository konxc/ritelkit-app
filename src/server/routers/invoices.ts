import { adminProcedure, router } from "../trpc";
import { invoices, orders } from "../../db/schema";
import { eq, desc, sql, or, like } from "drizzle-orm";
import { z } from "zod";

export const invoiceRouter = router({
  list: adminProcedure
    .input(
      z.object({
        q: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { q, limit, offset } = input;
      const whereClause = [];
      if (q) {
        whereClause.push(or(like(invoices.invoiceNo, `%${q}%`), like(orders.orderNo, `%${q}%`)));
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

      const finalQuery =
        whereClause.length > 0 ? baseQuery.where(sql`${sql.join(whereClause, sql` AND `)}`) : baseQuery;

      const rows = await finalQuery.orderBy(desc(invoices.createdAt)).limit(limit).offset(offset);

      const countQuery = ctx.db.select({ count: sql<number>`count(*)` }).from(invoices);
      const finalCountQuery = q
        ? countQuery.innerJoin(orders, eq(orders.id, invoices.orderId)).where(sql`${sql.join(whereClause, sql` AND `)}`)
        : countQuery;

      const totalRes = await finalCountQuery;

      return {
        rows,
        total: totalRes[0]?.count || 0,
      };
    }),
});
