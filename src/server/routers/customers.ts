import { z } from "zod";
import { router, adminProcedure } from "@server/trpc";
import { customers } from "@db/schema";
import { CustomerSchema } from "@lib/types";
import { eq, desc, or, like, sql } from "drizzle-orm";

export const customerRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          offset: z.number().optional().default(0),
          limit: z.number().optional().default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { q, offset = 0, limit = 20 } = input || {};

      let whereClause: any;
      if (q) {
        whereClause = or(
          like(customers.name, `%${q}%`),
          like(customers.phone, `%${q}%`),
          like(customers.email, `%${q}%`),
        );
      }

      const data = await ctx.db
        .select()
        .from(customers)
        .where(whereClause)
        .orderBy(desc(customers.createdAt))
        .limit(limit)
        .offset(offset)
        .all();

      const totalRes = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(whereClause)
        .get();

      return {
        data,
        total: totalRes?.count || 0,
      };
    }),

  create: adminProcedure
    .input(CustomerSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newCustomer = {
        id,
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      await ctx.db.insert(customers).values(newCustomer).run();
      return newCustomer;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: CustomerSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      await ctx.db
        .update(customers)
        .set({ ...(input.data as any), updatedAt: now })
        .where(eq(customers.id, input.id))
        .run();
      return { id: input.id, ...(input.data as any) };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(customers).where(eq(customers.id, input)).run();
    return { success: true };
  }),
});
