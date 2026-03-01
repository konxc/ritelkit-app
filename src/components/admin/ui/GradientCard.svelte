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

<div class="bg-gradient-to-br from-stone-900 to-stone-800 rounded-[1.5rem] p-6 shadow-lg text-white relative overflow-hidden {className}">
  <div
    class="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"
  ></div>

  {#if icon}
    <div
      class="w-12 h-12 rounded-2xl bg-white/10 border border-white/5 flex items-center justify-center text-[#c48a3a] mb-4 relative z-10"
    >
      {@html icon}
    </div>
  {/if}

  <h2
    class="font-['Syne',sans-serif] text-xl font-bold text-white mb-1 relative z-10 flex items-center justify-between"
  >
    {title}
  </h2>
  {#if description}
    <p class="text-stone-400 text-sm relative z-10 mb-6">
      {description}
    </p>
  {/if}

  {#if children}
    <div class="relative z-10 mt-6">
      {@render children()}
    </div>
  {/if}
</div>
