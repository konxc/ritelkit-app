import { adminProcedure, router } from "@/server/trpc";
import { notifications } from "@/db/schema";
import { eq, or, like, desc, sql, and } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/admin";

export const notificationRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          status: z.string().optional(),
          limit: z.number().default(30),
          offset: z.number().default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const q = input?.q;
      const status = input?.status;
      const limit = input?.limit ?? 30;
      const offset = input?.offset ?? 0;

      const whereClause: any[] = [];
      if (q) {
        whereClause.push(or(like(notifications.recipient, `%${q}%`), like(notifications.payloadJson, `%${q}%`)));
      }
      if (status) {
        whereClause.push(eq(notifications.status, status));
      }

      const finalWhere = whereClause.length > 0 ? and(...whereClause) : undefined;

      const rows = await ctx.db
        .select()
        .from(notifications)
        .where(finalWhere)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(finalWhere);

      return { rows, count };
    }),

  create: adminProcedure
    .input(
      z.object({
        channel: z.string(),
        recipient: z.string(),
        template: z.string().optional(),
        payloadJson: z.string().optional(),
        status: z.string().default("pending"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      await ctx.db.insert(notifications).values({
        id,
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await logAudit(ctx.ctx, "create_notification", "notification", id, input);
      return { ok: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.any(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ ...input.data, updatedAt: new Date().toISOString() })
        .where(eq(notifications.id, input.id));
      await logAudit(ctx.ctx, "update_notification", "notification", input.id, input.data);
      return { ok: true };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(notifications).where(eq(notifications.id, input));
    await logAudit(ctx.ctx, "delete_notification", "notification", input);
    return { ok: true };
  }),

  send: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    // Logic to send notification would go here
    await ctx.db
      .update(notifications)
      .set({ status: "sent", sentAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(eq(notifications.id, input));
    await logAudit(ctx.ctx, "send_notification", "notification", input);
    return { ok: true };
  }),
});
