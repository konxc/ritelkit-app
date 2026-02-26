import { adminProcedure, router } from "../trpc";
import { refunds } from "../../db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";

export const refundRouter = router({
    list: adminProcedure
        .input(z.object({
            limit: z.number().default(20),
            offset: z.number().default(0),
        }))
        .query(async ({ ctx, input }) => {
            return await ctx.db
                .select()
                .from(refunds)
                .orderBy(desc(refunds.createdAt))
                .limit(input.limit)
                .offset(input.offset);
        }),
});
