<script lang="ts">
import type { Snippet } from "svelte";
let {
  title,
  icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>`,
  onclick,
  href,
}: {
  title: string;
  icon?: string;
  onclick?: () => void;
  href?: string;
} = $props();
</script>

{#if href}
  <a
    {href}
    {onclick}
    class="group bg-[#fdfcf9] rounded-[1.5rem] p-6 border-2 border-dashed border-stone-200 hover:border-[#c48a3a]/50 hover:bg-[#c48a3a]/5 transition-colors cursor-pointer flex flex-col items-center justify-center text-center no-underline"
  >
    <div
      class="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-white group-hover:text-[#c48a3a] group-hover:shadow-[0_2px_12px_rgba(196,138,58,0.15)] transition-all mb-3"
    >
      {@html icon}
    </div>
    <h3
      class="font-bold text-stone-900 text-sm group-hover:text-[#c48a3a] transition-colors"
    >
      {title}
    </h3>
  </a>
{:else}
  <button
    {onclick}
    type="button"
    class="w-full group bg-[#fdfcf9] rounded-[1.5rem] p-6 border-2 border-dashed border-stone-200 hover:border-[#c48a3a]/50 hover:bg-[#c48a3a]/5 transition-colors cursor-pointer flex flex-col items-center justify-center text-center"
  >
    <div
      class="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-white group-hover:text-[#c48a3a] group-hover:shadow-[0_2px_12px_rgba(196,138,58,0.15)] transition-all mb-3"
    >
      {@html icon}
    </div>
    <h3
      class="font-bold text-stone-900 text-sm group-hover:text-[#c48a3a] transition-colors"
    >
      {title}
    </h3>
  </button>
{/if}
