import { adminProcedure, router } from "@server/trpc";
import { products, categories } from "@db/schema";
import { ProductSchema } from "@lib/types";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@lib/admin";

export const productRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          categoryId: z.string().optional(),
          status: z.string().optional(),
          page: z.number().optional().default(1),
          limit: z.number().optional().default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { q, categoryId, status, page = 1, limit = 50 } = input || {};
      const offset = (page - 1) * limit;

      let whereClause: any;
      const conditions = [];

      if (q) {
        conditions.push(
          or(like(products.name, `%${q}%`), like(products.sku, `%${q}%`), like(products.description, `%${q}%`)),
        );
      }

      if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId));
      }

      if (status) {
        conditions.push(eq(products.isActive, status === "active" ? 1 : 0));
      }

      if (conditions.length > 0) {
        whereClause = and(...conditions);
      }

      const data = await ctx.db
        .select({
          id: products.id,
          sku: products.sku,
          name: products.name,
          slug: products.slug,
          description: products.description,
          categoryId: products.categoryId,
          categoryName: categories.name,
          price: products.price,
          cost: products.cost,
          stock: products.stock,
          isActive: products.isActive,
          imagesJson: products.imagesJson,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause)
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset);

      const totalRes = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause);

      return {
        data,
        total: totalRes[0]?.count || 0,
      };
    }),

  create: adminProcedure
    .input(ProductSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      await ctx.db.insert(products).values({
        id,
        ...input,
        createdAt: now,
        updatedAt: now,
      });

      await logAudit(ctx.ctx, "create_product", "product", id, { name: input.name, sku: input.sku });

      return { ok: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: ProductSchema.partial().omit({ id: true, createdAt: true, updatedAt: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      await ctx.db
        .update(products)
        .set({ ...(input.data as any), updatedAt: now })
        .where(eq(products.id, input.id));

      await logAudit(ctx.ctx, "update_product", "product", input.id, input.data);

      return { ok: true };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(products).where(eq(products.id, input));
    await logAudit(ctx.ctx, "delete_product", "product", input);
    return { ok: true };
  }),
});
