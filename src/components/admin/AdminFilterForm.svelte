<script lang="ts">
  let { action, method = "get" }: { action?: string; method?: "get" | "post" } = $props();
</script>

<form action={action} method={method}>
  <slot />
</form>
