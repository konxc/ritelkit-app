<script lang="ts">
import type { Snippet } from "svelte";

let {
  title,
  className = "",
  children,
}: { title?: string; className?: string; children?: Snippet } = $props();
</script>

<div class={`card ${className}`.trim()}>
  {#if title}
    <strong>{title}</strong>
  {/if}
  {@render children?.()}
</div>
