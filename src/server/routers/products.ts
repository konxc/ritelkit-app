import { adminProcedure, router } from "../trpc";
import { products, categories } from "../../db/schema";
import { ProductSchema } from "../../lib/types";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const productRouter = router({
    list: adminProcedure.query(async ({ ctx }) => {
        return await ctx.db
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
            .orderBy(desc(products.createdAt));
    }),

    create: adminProcedure
        .input(ProductSchema.omit({ id: true, createdAt: true, updatedAt: true }))
        .mutation(async ({ ctx, input }) => {
            const now = new Date().toISOString();
            await ctx.db.insert(products).values({
                id: crypto.randomUUID(),
                ...input,
                createdAt: now,
                updatedAt: now,
            });
            return { ok: true };
        }),


    update: adminProcedure
        .input(z.object({
            id: z.string(),
            data: ProductSchema.partial().omit({ id: true, createdAt: true, updatedAt: true })
        }))
        .mutation(async ({ ctx, input }) => {
            const now = new Date().toISOString();
            await ctx.db.update(products)
                .set({ ...(input.data as any), updatedAt: now })
                .where(eq(products.id, input.id));
            return { ok: true };
        }),

    delete: adminProcedure
        .input(z.string())
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(products).where(eq(products.id, input));
            return { ok: true };
        }),
});
