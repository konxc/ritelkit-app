<script lang="ts">
  interface Props {
    buttonContent?: import("svelte").Snippet;
    class?: string;
    children?: import("svelte").Snippet;
    [key: string]: any;
  }

  let { buttonContent, class: className = "", children, ...rest }: Props = $props();
  let isOpen = $state(false);

  // Close when clicking outside
  const handleOutsideClick = (e: MouseEvent) => {
    if (isOpen) {
      const target = e.target as HTMLElement;
      if (!target.closest(".popover-container")) {
        isOpen = false;
      }
    }
  };
</script>

<svelte:window onclick={handleOutsideClick} />

<div class="popover-container relative flex justify-center {className}" {...rest}>
  <div
    role="button"
    tabindex="0"
    onclick={() => (isOpen = !isOpen)}
    onkeydown={(e) => e.key === "Enter" && (isOpen = !isOpen)}
    class="cursor-pointer"
  >
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
          class="text-stone-400 transition-transform duration-300 {isOpen ? 'rotate-180' : ''}"
        >
          <path d="m6 9 6 6 6-6"></path>
        </svg>
      </button>
    {/if}
  </div>

  <!-- Popover Menu -->
  {#if isOpen}
    <div class="absolute top-full z-50 mt-2 w-48 translate-y-0 opacity-100 transition-all duration-200">
      <div
        class="rounded-2xl border border-stone-200/80 bg-white p-2 shadow-[0_10px_40px_rgba(0,0,0,0.1)]"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        role="presentation"
      >
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  {/if}
</div>
