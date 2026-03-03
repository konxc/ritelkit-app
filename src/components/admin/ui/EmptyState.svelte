<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
  title: string;
  description?: string;
  icon?: Snippet;
  class?: string;
  [key: string]: any;
}

let { title, description = "", icon, class: className = "", ...rest }: Props = $props();
</script>

<div
  class="flex flex-col items-center justify-center py-12 px-6 text-center border-2 border-dashed border-stone-100 rounded-[1.5rem] bg-stone-50/50 {className}"
  {...rest}
>
  {#if icon}
    <div class="w-16 h-16 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-center text-stone-300 mb-4">
      {@render icon()}
    </div>
  {/if}
  
  <h3 class="font-bold text-stone-900 mb-1">{title}</h3>
  
  {#if description}
    <p class="text-sm text-stone-500 max-w-sm">
      {description}
    </p>
  {/if}
</div>
