<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
  title: string;
  icon?: Snippet;
  onclick?: () => void;
  href?: string;
  class?: string;
  [key: string]: any;
}

let { title, icon, onclick, href, class: className = "", ...rest }: Props = $props();

let commonClasses =
  "group w-full bg-[#fdfcf9] rounded-[1.5rem] p-6 border-2 border-dashed border-stone-200 hover:border-[#c48a3a]/50 hover:bg-[#c48a3a]/5 transition-all cursor-pointer flex flex-col items-center justify-center text-center";
</script>

{#if href}
  <a
    {href}
    class="{commonClasses} no-underline {className}"
    {...rest}
  >
    {#if icon}
      <div class="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-white group-hover:text-[#c48a3a] group-hover:shadow-[0_2px_12px_rgba(196,138,58,0.15)] transition-all mb-3">
        {@render icon()}
      </div>
    {/if}
    <h3 class="font-bold text-stone-900 text-sm group-hover:text-[#c48a3a] transition-colors">
      {title}
    </h3>
  </a>
{:else}
  <button
    type="button"
    {onclick}
    class="{commonClasses} {className}"
    {...rest}
  >
    {#if icon}
      <div class="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-white group-hover:text-[#c48a3a] group-hover:shadow-[0_2px_12px_rgba(196,138,58,0.15)] transition-all mb-3">
        {@render icon()}
      </div>
    {/if}
    <h3 class="font-bold text-stone-900 text-sm group-hover:text-[#c48a3a] transition-colors">
      {title}
    </h3>
  </button>
{/if}
