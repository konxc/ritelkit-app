<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
  children?: Snippet;
  class?: string;
  [key: string]: any;
}

let { children, class: className = "", ...rest }: Props = $props();
</script>

<tr
  class="group/tr relative transition-all duration-300 hover:bg-stone-50/80 lg:hover:bg-gradient-to-r lg:hover:from-white lg:hover:to-[#c48a3a]/5 {className}"
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</tr>
