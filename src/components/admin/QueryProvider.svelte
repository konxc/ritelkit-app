<script lang="ts">
  import { QueryClientProvider, hydrate } from "@tanstack/svelte-query";
  import { createQueryClient } from "@/lib/queryClient";

  let { children, initialData = null } = $props();

  // Create a new QueryClient instance for each request on server
  // On client, this will persist if used correctly
  const queryClient = createQueryClient();

  $effect(() => {
    if (initialData) {
      hydrate(queryClient, initialData);
    }
  });
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
</QueryClientProvider>
