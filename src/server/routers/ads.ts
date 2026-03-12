import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import { adsCampaigns } from "../../db/schema";
import { AdsCampaignSchema } from "../../lib/types";
import { eq, desc, or, like, and, sql } from "drizzle-orm";

export const adsRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          status: z.string().optional(),
          offset: z.number().optional().default(0),
          limit: z.number().optional().default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { q, status, offset = 0, limit = 20 } = input || {};

      let whereClause: any;
      const conditions = [];

      if (q) {
        conditions.push(or(like(adsCampaigns.name, `%${q}%`), like(adsCampaigns.channel, `%${q}%`)));
      }

      if (status) {
        conditions.push(eq(adsCampaigns.status, status as any));
      }

      if (conditions.length > 0) {
        whereClause = and(...conditions);
      }

      const data = await ctx.db
        .select()
        .from(adsCampaigns)
        .where(whereClause)
        .orderBy(desc(adsCampaigns.createdAt))
        .limit(limit)
        .offset(offset)
        .all();

      const totalRes = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(adsCampaigns)
        .where(whereClause)
        .get();

      return {
        data,
        total: totalRes?.count || 0,
      };
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      await ctx.db
        .update(adsCampaigns)
        .set({ ...(input.data as any), updatedAt: now })
        .where(eq(adsCampaigns.id, input.id))
        .run();
      return { id: input.id, ...(input.data as any) };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(adsCampaigns).where(eq(adsCampaigns.id, input)).run();
    return { success: true };
  }),
});
