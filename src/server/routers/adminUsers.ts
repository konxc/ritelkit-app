import { adminProcedure, router } from "../trpc";
import { adminUsers } from "../../db/schema";
import { eq, or, like } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "../../lib/admin";
import { hashPassword } from "../../lib/auth";

export const adminUserRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { q } = input || {};

      let whereClause: any;
      if (q) {
        whereClause = or(like(adminUsers.email, `%${q}%`));
      }

      const rows = await ctx.db
        .select({
          id: adminUsers.id,
          email: adminUsers.email,
          role: adminUsers.role,
          createdAt: adminUsers.createdAt,
        })
        .from(adminUsers)
        .where(whereClause);

      return rows;
    }),

  create: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(["owner", "admin", "editor"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { email, password, role } = input;
      const passwordHash = await hashPassword(password);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await ctx.db.insert(adminUsers).values({
        id,
        email,
        passwordHash,
        role,
        createdAt: now,
      });

      await logAudit(ctx.ctx, "create_admin_user", "admin_user", id, { email, role });

      return { ok: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          email: z.string().email().optional(),
          password: z.string().min(8).optional(),
          role: z.enum(["owner", "admin", "editor"]).optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;
      const updates: any = { ...data };

      if (data.password) {
        updates.passwordHash = await hashPassword(data.password);
        delete updates.password;
      }

      await ctx.db.update(adminUsers).set(updates).where(eq(adminUsers.id, id));

      await logAudit(ctx.ctx, "update_admin_user", "admin_user", id, data);

      return { ok: true };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(adminUsers).where(eq(adminUsers.id, input));
    await logAudit(ctx.ctx, "delete_admin_user", "admin_user", input);
    return { ok: true };
  }),
});
