<script lang="ts">
  import type { Snippet } from "svelte";

  let { title, class: className = "", children }: { title?: string; class?: string; children?: Snippet } = $props();
</script>

<div class={`card ${className}`.trim()}>
  {#if title}
    <strong>{title}</strong>
  {/if}
  {@render children?.()}
</div>
