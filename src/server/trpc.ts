import { initTRPC, TRPCError } from "@trpc/server";
import type { APIContext } from "astro";
import { getDrizzle } from "../lib/db";

export interface Context {
    db: ReturnType<typeof getDrizzle>;
    admin: any;
    ctx: APIContext;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware for Admin authentication
const isAdmin = t.middleware(async ({ ctx, next }) => {
    if (!ctx.admin) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
        ctx: {
            admin: ctx.admin,
        },
    });
});

export const adminProcedure = publicProcedure.use(isAdmin);
