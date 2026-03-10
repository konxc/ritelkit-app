import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import { inventoryMovements, products } from "../../db/schema";
import { eq, desc, or, like, sql, and } from "drizzle-orm";
import { logAudit } from "../../lib/admin";

export const inventoryRouter = router({
  listMovements: adminProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          page: z.number().optional().default(1),
          limit: z.number().optional().default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { q, page = 1, limit = 50 } = input || {};
      const offset = (page - 1) * limit;

      // Note: We might want to filter by product name if 'q' is provided, but since we retrieve movements, we need to join products and then filter
      let whereClause: any;
      if (q) {
        // If searching across movements, maybe filter by product name or sku? We'll search product name and sku.
        whereClause = or(like(products.name, `%${q}%`), like(products.sku, `%${q}%`));
      }

      const data = await ctx.db
        .select({
          id: inventoryMovements.id,
          productId: inventoryMovements.productId,
          type: inventoryMovements.type,
          qty: inventoryMovements.qty,
          notes: inventoryMovements.notes,
          refOrderNo: inventoryMovements.refOrderNo,
          createdAt: inventoryMovements.createdAt,
          product_name: products.name,
        })
        .from(inventoryMovements)
        .leftJoin(products, eq(inventoryMovements.productId, products.id))
        .where(whereClause)
        .orderBy(desc(inventoryMovements.createdAt))
        .limit(limit)
        .offset(offset);

      const totalRes = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(inventoryMovements)
        .leftJoin(products, eq(inventoryMovements.productId, products.id))
        .where(whereClause);

      return {
        data,
        total: totalRes[0]?.count || 0,
      };
    }),

  listProducts: adminProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          categoryId: z.string().optional(),
          page: z.number().optional().default(1),
          limit: z.number().optional().default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { q, categoryId, page = 1, limit = 50 } = input || {};
      const offset = (page - 1) * limit;

      const conditions = [];

      if (q) {
        conditions.push(or(like(products.name, `%${q}%`), like(products.sku, `%${q}%`)));
      }

      if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await ctx.db
        .select({
          id: products.id,
          sku: products.sku,
          name: products.name,
          price: products.price,
          stock: products.stock,
        })
        .from(products)
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

  createMovement: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        type: z.enum(["in", "out", "adjustment"]),
        qty: z.number(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await ctx.db.transaction(async (tx) => {
        // 1. Insert movement record
        await tx
          .insert(inventoryMovements)
          .values({
            id,
            ...input,
            createdAt: now,
          })
          .run();

        // 2. Update product stock
        const product = await tx.select().from(products).where(eq(products.id, input.productId)).get();
        if (!product) throw new Error("Product not found");

        let newStock = product.stock || 0;
        if (input.type === "in") newStock += input.qty;
        else if (input.type === "out") newStock -= input.qty;
        else if (input.type === "adjustment") newStock = input.qty;

        await tx
          .update(products)
          .set({ stock: newStock, updatedAt: now })
          .where(eq(products.id, input.productId))
          .run();
      });

      await logAudit(ctx.ctx, "create_inventory_movement", "inventory_movement", input.productId, {
        type: input.type,
        qty: input.qty,
      });

      return { success: true };
    }),
});
