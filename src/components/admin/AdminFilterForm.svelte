<script lang="ts">
  import type { Snippet } from 'svelte';

  let { action, method = "get", children }: { action?: string; method?: "get" | "post"; children?: Snippet } = $props();
</script>

  <form action={action} method={method}>
    {@render children?.()}
  </form>
