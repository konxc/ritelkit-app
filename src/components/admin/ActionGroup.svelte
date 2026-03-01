<script lang="ts">
import type { Snippet } from "svelte";

let { className = "", children }: { className?: string; children?: Snippet } = $props();
</script>

<div class={`table-actions ${className}`.trim()}>
  {@render children?.()}
</div>
