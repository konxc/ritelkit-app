import { adminProcedure, router } from "@server/trpc";
import { auditLogs } from "@db/schema";
import { or, like, desc, sql, and } from "drizzle-orm";
import { z } from "zod";

export const auditLogRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          limit: z.number().default(30),
          offset: z.number().default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const q = input?.q;
      const limit = input?.limit ?? 30;
      const offset = input?.offset ?? 0;

      const whereClause: any[] = [];
      if (q) {
        whereClause.push(
          or(
            like(auditLogs.actorEmail, `%${q}%`),
            like(auditLogs.action, `%${q}%`),
            like(auditLogs.entityType, `%${q}%`),
            like(auditLogs.entityId, `%${q}%`),
            like(auditLogs.dataJson, `%${q}%`),
          ),
        );
      }

      const finalWhere = whereClause.length > 0 ? and(...whereClause) : undefined;

      const rows = await ctx.db
        .select()
        .from(auditLogs)
        .where(finalWhere)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(finalWhere);

      return { rows, count };
    }),
});
