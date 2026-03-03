<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
  children?: Snippet;
  class?: string;
  [key: string]: any;
}

let { children, class: className = "", ...rest }: Props = $props();
</script>

<tr class="hover:bg-stone-50/50 transition-colors {className}" {...rest}>
  {#if children}
    {@render children()}
  {/if}
</tr>
