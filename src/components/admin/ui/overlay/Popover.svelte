<script lang="ts">
interface Props {
  buttonContent?: import("svelte").Snippet;
  class?: string;
  children?: import("svelte").Snippet;
  [key: string]: any;
}

let { buttonContent, class: className = "", children, ...rest }: Props = $props();
</script>

<div class="relative group flex justify-center {className}" {...rest}>
  {#if buttonContent}
    {@render buttonContent()}
  {:else}
    <button class="px-4 py-2 rounded-xl bg-white border border-stone-200 flex items-center gap-2 text-stone-700 font-semibold hover:bg-stone-50 shadow-sm transition-colors">
        Opsi Lanjutan
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400 group-hover:rotate-180 transition-transform duration-300">
          <path d="m6 9 6 6 6-6"></path>
        </svg>
    </button>
  {/if}

  <!-- Popover Menu -->
  <div class="absolute top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-200 z-50">
      <div class="bg-white rounded-2xl border border-stone-200/80 shadow-[0_10px_40px_rgba(0,0,0,0.1)] p-2">
        {#if children}
            {@render children()}
        {/if}
      </div>
  </div>
</div>
