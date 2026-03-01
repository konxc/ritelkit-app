import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { APIContext } from "astro";
import { appRouter } from "../../../server/router";
import { createContext } from "../../../server/context";

export const ALL = async (context: APIContext) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: context.request,
    router: appRouter,
    createContext: () => createContext(context),
  });
};
