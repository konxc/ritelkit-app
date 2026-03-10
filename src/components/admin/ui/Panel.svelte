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

<div class="rounded-[1.5rem] border border-stone-200/60 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] {className}">
  {#if title || action}
    <div class="mb-6 flex items-center justify-between">
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
