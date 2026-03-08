import { adminProcedure, router } from "../trpc";
import { categories } from "../../db/schema";
import { CategorySchema } from "../../lib/types";
import { eq, asc, like, sql } from "drizzle-orm";
import { z } from "zod";

export const categoryRouter = router({
  list: adminProcedure
    .input(
      z.object({
        q: z.string().optional(),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { q, page = 1, limit = 50 } = input || {};
      const offset = (page - 1) * limit;

      const whereClause = q ? like(categories.name, `%${q}%`) : undefined;

      const data = await ctx.db
        .select()
        .from(categories)
        .where(whereClause)
        .orderBy(asc(categories.sortOrder), asc(categories.name))
        .limit(limit)
        .offset(offset);
      
      const totalRes = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(categories)
        .where(whereClause);
        
      return {
        data,
        total: totalRes[0]?.count || 0,
      };
    }),

  create: adminProcedure
    .input(CategorySchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      await ctx.db.insert(categories).values({
        id: crypto.randomUUID(),
        ...input,
        createdAt: now,
        updatedAt: now,
      });
      return { ok: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: CategorySchema.partial().omit({ id: true, createdAt: true, updatedAt: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      await ctx.db
        .update(categories)
        .set({ ...(input.data as any), updatedAt: now })
        .where(eq(categories.id, input.id));
      return { ok: true };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(categories).where(eq(categories.id, input));
    return { ok: true };
  }),
});
