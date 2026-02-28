<script lang="ts">
import type { Snippet } from "svelte";

let { title, children }: { title: string; children?: Snippet } = $props();
</script>

<div class="toolbar">
  <strong>{title}</strong>
  {@render children?.()}
</div>
