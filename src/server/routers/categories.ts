import { adminProcedure, router } from "../trpc";
import { categories } from "../../db/schema";
import { CategorySchema } from "../../lib/types";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

export const categoryRouter = router({
    list: adminProcedure.query(async ({ ctx }) => {
        return await ctx.db
            .select()
            .from(categories)
            .orderBy(asc(categories.sortOrder), asc(categories.name));
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
        .input(z.object({
            id: z.string(),
            data: CategorySchema.partial().omit({ id: true, createdAt: true, updatedAt: true })
        }))
        .mutation(async ({ ctx, input }) => {
            const now = new Date().toISOString();
            await ctx.db.update(categories)
                .set({ ...input.data, updatedAt: now })
                .where(eq(categories.id, input.id));
            return { ok: true };
        }),

    delete: adminProcedure
        .input(z.string())
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(categories).where(eq(categories.id, input));
            return { ok: true };
        }),
});
