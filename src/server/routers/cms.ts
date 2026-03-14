import { adminProcedure, router } from "@/server/trpc";
import { cmsPages } from "@/db/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/admin";

export const cmsRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          status: z.string().optional(),
          page: z.number().optional().default(1),
          limit: z.number().optional().default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { q, status, page = 1, limit = 50 } = input || {};
      const offset = (page - 1) * limit;

      let whereClause: any;
      const conditions = [];

      if (q) {
        conditions.push(
          or(like(cmsPages.title, `%${q}%`), like(cmsPages.slug, `%${q}%`), like(cmsPages.contentMd, `%${q}%`)),
        );
      }

      if (status) {
        conditions.push(eq(cmsPages.isActive, status === "active" ? 1 : 0));
      }

      if (conditions.length > 0) {
        whereClause = and(...conditions);
      }

      const rows = await ctx.db
        .select()
        .from(cmsPages)
        .where(whereClause)
        .orderBy(desc(cmsPages.updatedAt))
        .limit(limit)
        .offset(offset);

      const totalRes = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(cmsPages)
        .where(whereClause);

      return {
        rows,
        total: totalRes[0]?.count || 0,
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string(),
        slug: z.string(),
        contentMd: z.string(),
        isActive: z.number().optional().default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      await ctx.db.insert(cmsPages).values({
        id,
        ...input,
        createdAt: now,
        updatedAt: now,
      });

      await logAudit(ctx.ctx, "create_cms_page", "cms_page", id, { title: input.title, slug: input.slug });

      return { ok: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          title: z.string().optional(),
          slug: z.string().optional(),
          contentMd: z.string().optional(),
          isActive: z.number().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      await ctx.db
        .update(cmsPages)
        .set({ ...(input.data as any), updatedAt: now })
        .where(eq(cmsPages.id, input.id));

      await logAudit(ctx.ctx, "update_cms_page", "cms_page", input.id, input.data);

      return { ok: true };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(cmsPages).where(eq(cmsPages.id, input));
    await logAudit(ctx.ctx, "delete_cms_page", "cms_page", input);
    return { ok: true };
  }),
});
