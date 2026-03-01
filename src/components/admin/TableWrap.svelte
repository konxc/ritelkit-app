<script lang="ts">
import type { Snippet } from "svelte";

let {
  class: className = "",
  children,
  ...rest
}: { class?: string; children?: Snippet; [key: string]: unknown } = $props();
</script>

<div class={`w-full overflow-x-auto bg-white border border-stone-200/80 rounded-2xl shadow-sm ${className}`.trim()} {...rest}>
  {@render children?.()}
</div>
