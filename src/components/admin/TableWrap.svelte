<script lang="ts">
import type { Snippet } from "svelte";

let {
	class: className = "",
	children,
	...rest
}: { class?: string; children?: Snippet; [key: string]: unknown } = $props();
</script>

<div class={`table-wrap ${className}`.trim()} {...rest}>
  {@render children?.()}
</div>
