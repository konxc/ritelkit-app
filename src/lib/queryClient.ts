import { QueryClient } from "@tanstack/svelte-query";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: 1000 * 60, // 1 minute
      },
    },
  });

// For client-side singleton if needed, but better to manage in QueryProvider
export const queryClient = createQueryClient();
