import { adminProcedure, router } from "@server/trpc";
import { categories } from "@db/schema";
import { CategorySchema } from "@lib/types";
import { eq, asc, like, and, sql } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@lib/admin";

export const categoryRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          status: z.string().optional(),
          page: z.number().optional().default(1),
          limit: z.number().optional().default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { q, status, page = 1, limit = 50 } = input || {};
      const offset = (page - 1) * limit;

      const conditions = [];
      if (q) conditions.push(like(categories.name, `%${q}%`));
      if (status) conditions.push(eq(categories.isActive, status === "active" ? 1 : 0));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
      const id = crypto.randomUUID();
      await ctx.db.insert(categories).values({
        id,
        ...input,
        createdAt: now,
        updatedAt: now,
      });

      await logAudit(ctx.ctx, "create_category", "category", id, { name: input.name });

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

      await logAudit(ctx.ctx, "update_category", "category", input.id, input.data);

      return { ok: true };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(categories).where(eq(categories.id, input));
    await logAudit(ctx.ctx, "delete_category", "category", input);
    return { ok: true };
  }),
});
