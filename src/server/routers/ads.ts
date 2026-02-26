import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import { adsCampaigns } from "../../db/schema";
import { AdsCampaignSchema } from "../../lib/types";
import { eq, desc } from "drizzle-orm";

export const adsRouter = router({
    list: adminProcedure.query(async ({ ctx }) => {
        return ctx.db.select().from(adsCampaigns).orderBy(desc(adsCampaigns.createdAt)).all();
    }),

    create: adminProcedure
        .input(AdsCampaignSchema.omit({ id: true, createdAt: true, updatedAt: true }))
        .mutation(async ({ ctx, input }) => {
            const id = crypto.randomUUID();
            const now = new Date().toISOString();
            const newCampaign = {
                id,
                ...input,
                createdAt: now,
                updatedAt: now,
            };
            await ctx.db.insert(adsCampaigns).values(newCampaign).run();
            return newCampaign;
        }),

    update: adminProcedure
        .input(
            z.object({
                id: z.string(),
                data: AdsCampaignSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const now = new Date().toISOString();
            await ctx.db
                .update(adsCampaigns)
                .set({ ...input.data, updatedAt: now })
                .where(eq(adsCampaigns.id, input.id))
                .run();
            return { id: input.id, ...input.data };
        }),

    delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
        await ctx.db.delete(adsCampaigns).where(eq(adsCampaigns.id, input)).run();
        return { success: true };
    }),
});
