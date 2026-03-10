<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    title,
    icon,
    description,
    children,
    class: className = "",
  }: {
    title: string;
    icon?: string;
    description?: string;
    children?: Snippet;
    class?: string;
  } = $props();
</script>

<div
  class="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-stone-900 via-stone-800 to-[#322312] p-6 text-white shadow-xl shadow-[#322312]/30 {className}"
>
  <div class="pointer-events-none absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>

  {#if icon}
    <div
      class="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 text-[#d19c50] shadow-inner backdrop-blur-md"
    >
      {@html icon}
    </div>
  {/if}

  <h2
    class="relative z-10 mb-1 flex items-center justify-between font-['Syne',sans-serif] text-xl font-bold text-white"
  >
    {title}
  </h2>
  {#if description}
    <p class="relative z-10 mb-6 text-sm text-stone-400">
      {description}
    </p>
  {/if}

  {#if children}
    <div class="relative z-10 mt-6">
      {@render children()}
    </div>
  {/if}
</div>
