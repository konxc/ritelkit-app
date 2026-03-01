<script lang="ts">
import type { Snippet } from "svelte";

let {
  title,
  action,
  children,
  class: className = "",
}: {
  title?: string;
  action?: Snippet;
  children?: Snippet;
  class?: string;
} = $props();
</script>

<div class="bg-white rounded-[1.5rem] p-6 border border-stone-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] {className}">
  {#if title || action}
    <div class="flex items-center justify-between mb-6">
      {#if title}
        <h2 class="font-['Syne',sans-serif] text-xl font-bold text-stone-800">
          {title}
        </h2>
      {/if}
      {#if action}
        {@render action()}
      {/if}
    </div>
  {/if}
  {@render children?.()}
</div>
