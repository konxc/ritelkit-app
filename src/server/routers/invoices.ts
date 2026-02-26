import { adminProcedure, router } from "../trpc";
import { invoices, orders } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const invoiceRouter = router({
    list: adminProcedure
        .input(z.object({
            limit: z.number().default(20),
            offset: z.number().default(0),
        }))
        .query(async ({ ctx, input }) => {
            return await ctx.db
                .select({
                    id: invoices.id,
                    invoiceNo: invoices.invoiceNo,
                    status: invoices.status,
                    issuedAt: invoices.issuedAt,
                    dueAt: invoices.dueAt,
                    orderNo: orders.orderNo,
                })
                .from(invoices)
                .innerJoin(orders, eq(orders.id, invoices.orderId))
                .orderBy(desc(invoices.createdAt))

                .limit(input.limit)
                .offset(input.offset);
        }),
});
