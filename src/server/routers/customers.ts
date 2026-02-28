import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import { customers } from "../../db/schema";
import { CustomerSchema } from "../../lib/types";
import { eq, desc } from "drizzle-orm";


export const customerRouter = router({
    list: adminProcedure.query(async ({ ctx }) => {
        return ctx.db.select().from(customers).orderBy(desc(customers.createdAt)).all();
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
            })
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
