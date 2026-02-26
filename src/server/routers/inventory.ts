import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import { inventoryMovements, products } from "../../db/schema";
import { InventoryMovementSchema } from "../../lib/types";
import { eq, desc, sql } from "drizzle-orm";

export const inventoryRouter = router({
    listMovements: adminProcedure.query(async ({ ctx }) => {
        return ctx.db
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
            .orderBy(desc(inventoryMovements.createdAt))
            .limit(30)
            .all();
    }),

    listProducts: adminProcedure.query(async ({ ctx }) => {
        return ctx.db.select().from(products).all();
    }),

    createMovement: adminProcedure
        .input(
            z.object({
                productId: z.string(),
                type: z.enum(["in", "out", "adjustment"]),
                qty: z.number(),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const id = crypto.randomUUID();
            const now = new Date().toISOString();

            await ctx.db.transaction(async (tx) => {
                // 1. Insert movement record
                await tx.insert(inventoryMovements).values({
                    id,
                    ...input,
                    createdAt: now,
                }).run();

                // 2. Update product stock
                const product = await tx.select().from(products).where(eq(products.id, input.productId)).get();
                if (!product) throw new Error("Produk tidak ditemukan");

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

            return { success: true };
        }),
});
