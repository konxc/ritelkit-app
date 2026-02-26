import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import { coupons } from "../../db/schema";
import { CouponSchema } from "../../lib/types";
import { eq, desc } from "drizzle-orm";

export const couponRouter = router({
    list: adminProcedure.query(async ({ ctx }) => {
        return ctx.db.select().from(coupons).orderBy(desc(coupons.createdAt)).all();
    }),

    create: adminProcedure
        .input(CouponSchema.omit({ id: true, createdAt: true, updatedAt: true }))
        .mutation(async ({ ctx, input }) => {
            const id = crypto.randomUUID();
            const now = new Date().toISOString();
            const newCoupon = {
                id,
                ...input,
                createdAt: now,
                updatedAt: now,
            };
            await ctx.db.insert(coupons).values(newCoupon).run();
            return newCoupon;
        }),

    update: adminProcedure
        .input(
            z.object({
                id: z.string(),
                data: CouponSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const now = new Date().toISOString();
            await ctx.db
                .update(coupons)
                .set({ ...input.data, updatedAt: now })
                .where(eq(coupons.id, input.id))
                .run();
            return { id: input.id, ...input.data };
        }),

    delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
        await ctx.db.delete(coupons).where(eq(coupons.id, input)).run();
        return { success: true };
    }),
});
