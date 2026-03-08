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
  "group w-full bg-[#fdfcf9] rounded-[1.5rem] p-6 border-2 border-dashed border-stone-200 hover:border-[#c48a3a]/50 hover:bg-gradient-to-b hover:from-white hover:to-[#c48a3a]/5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center hover:shadow-[0_8px_24px_rgba(196,138,58,0.08)] hover:-translate-y-0.5 active:scale-[0.98]";
</script>

{#if href}
  <a {href} class="{commonClasses} no-underline {className}" {...rest}>
    {#if icon}
      <div
        class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 transition-all group-hover:bg-white group-hover:text-[#c48a3a] group-hover:shadow-[0_2px_12px_rgba(196,138,58,0.15)]"
      >
        {@render icon()}
      </div>
    {/if}
    <h3 class="text-sm font-bold text-stone-900 transition-colors group-hover:text-[#c48a3a]">
      {title}
    </h3>
  </a>
{:else}
  <button type="button" {onclick} class="{commonClasses} {className}" {...rest}>
    {#if icon}
      <div
        class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 transition-all group-hover:bg-white group-hover:text-[#c48a3a] group-hover:shadow-[0_2px_12px_rgba(196,138,58,0.15)]"
      >
        {@render icon()}
      </div>
    {/if}
    <h3 class="text-sm font-bold text-stone-900 transition-colors group-hover:text-[#c48a3a]">
      {title}
    </h3>
  </button>
{/if}
