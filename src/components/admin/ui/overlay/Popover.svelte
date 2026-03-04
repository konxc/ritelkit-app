<script lang="ts">
  interface Props {
    buttonContent?: import("svelte").Snippet;
    class?: string;
    children?: import("svelte").Snippet;
    [key: string]: any;
  }

  let { buttonContent, class: className = "", children, ...rest }: Props = $props();
</script>

<div class="group relative flex justify-center {className}" {...rest}>
  {#if buttonContent}
    {@render buttonContent()}
  {:else}
    <button
      class="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-50"
    >
      Opsi Lanjutan
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-stone-400 transition-transform duration-300 group-hover:rotate-180"
      >
        <path d="m6 9 6 6 6-6"></path>
      </svg>
    </button>
  {/if}

  <!-- Popover Menu -->
  <div
    class="invisible absolute top-full z-50 mt-2 w-48 translate-y-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
  >
    <div class="rounded-2xl border border-stone-200/80 bg-white p-2 shadow-[0_10px_40px_rgba(0,0,0,0.1)]">
      {#if children}
        {@render children()}
      {/if}
    </div>
  </div>
</div>
