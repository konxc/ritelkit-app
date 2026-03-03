<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
  children?: Snippet;
  align?: "left" | "center" | "right";
  bold?: boolean;
  class?: string;
  [key: string]: any;
}

let { children, align = "left", bold = false, class: className = "", ...rest }: Props = $props();

let alignClass = $derived.by(() => {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    default:
      return "text-left";
  }
});
</script>

<td 
  class="px-6 py-4 {alignClass} {bold ? 'font-medium text-stone-900' : 'text-stone-600'} {className}" 
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</td>
