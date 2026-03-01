import { adminProcedure, router } from "../trpc";
import { shipments } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const shipmentRouter = router({
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select()
        .from(shipments)
        .orderBy(desc(shipments.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  create: adminProcedure
    .input(
      z.object({
        orderNo: z.string(),
        status: z.string(),
        carrier: z.string().optional(),
        trackingNo: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await ctx.db.insert(shipments).values({
        id,
        orderNo: input.orderNo,
        status: input.status,
        carrier: input.carrier || null,
        trackingNo: input.trackingNo || null,
        notes: input.notes || null,
        createdAt: now,
        updatedAt: now,
      });
      return { id };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          status: z.string().optional(),
          carrier: z.string().optional(),
          trackingNo: z.string().optional(),
          notes: z.string().optional(),
          shippedAt: z.string().optional(),
          deliveredAt: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      await ctx.db
        .update(shipments)
        .set({ ...input.data, updatedAt: now })
        .where(eq(shipments.id, input.id));
      return { ok: true };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(shipments).where(eq(shipments.id, input));
    return { ok: true };
  }),
});
