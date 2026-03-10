<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { t } from "../../lib/i18n/store.svelte";

  let {
    title,
    children,
    class: className = "",
    showMobileFloat = true,
  }: {
    title: string;
    children?: Snippet;
    class?: string;
    showMobileFloat?: boolean;
  } = $props();

  let isVisible = $state(true);
  let hasChecked = $state(false);

  onMount(() => {
    // Use a more predictable key
    const storageKey = `catalog_toolbar_${title.toLowerCase().replace(/\s+/g, "_")}`;
    const saved = localStorage.getItem(storageKey);

    if (saved !== null) {
      isVisible = saved === "true";
    }
    // Set checked to true to allow rendering
    hasChecked = true;

    // Listen to external toggle events
    const handleRemoteToggle = () => toggle();
    window.addEventListener("toggle-admin-toolbar", handleRemoteToggle);

    return () => {
      window.removeEventListener("toggle-admin-toolbar", handleRemoteToggle);
    };
  });

  function toggle() {
    isVisible = !isVisible;
    const storageKey = `catalog_toolbar_${title.toLowerCase().replace(/\s+/g, "_")}`;
    localStorage.setItem(storageKey, String(isVisible));
  }
</script>

<div
  class="z-20 -mx-4 -mt-4 mb-6 flex-col justify-between gap-0 border-b border-stone-200/80 bg-white/98 px-5 py-3 shadow-sm backdrop-blur-md transition-all duration-300 sm:mx-0 sm:mt-0 sm:rounded-[2rem] sm:border sm:bg-white/95 sm:p-4 md:flex-row md:items-center md:gap-5 {className} {isVisible
    ? 'flex sm:border-stone-200/60 sm:shadow-[0_8px_30px_rgba(0,0,0,0.03)]'
    : 'hidden sm:border-transparent sm:bg-transparent sm:shadow-none'}"
>
  <div class="hidden items-center justify-between gap-2.5 md:flex">
    <div class="flex items-center gap-2.5">
      <div class="h-6 w-1.5 rounded-full bg-[#c48a3a]"></div>
      <h3 class="text-[1.05rem] font-extrabold tracking-tight text-stone-800">{title}</h3>
    </div>

    <!-- Toggle Button -->
    <button
      type="button"
      onclick={toggle}
      class="hidden h-8 w-8 items-center justify-center rounded-full bg-stone-50 text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-600 active:scale-90 lg:flex"
      title={isVisible ? t("nav.hide_filter") : t("nav.show_filter")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="transition-transform duration-300 {isVisible ? 'rotate-180' : ''}"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  </div>

  {#if isVisible && hasChecked}
    <div
      class="custom-scrollbar animate-in fade-in slide-in-from-top-1 flex w-full items-center gap-3 overflow-x-auto pb-1 duration-200 md:w-auto md:pb-0"
    >
      {@render children?.()}
    </div>
  {:else if !hasChecked}
    <!-- Placeholder or hidden to avoid layout shift -->
    <div class="h-0 md:h-10"></div>
  {/if}
</div>

{#if showMobileFloat}
  <!-- Mobile Float Toggle (Placed above main FAB) -->
  <div class="pointer-events-auto fixed right-5 bottom-[170px] z-[45] lg:hidden">
    <button
      type="button"
      onclick={toggle}
      class="flex h-14 w-14 flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all active:scale-95"
      title={isVisible ? t("nav.hide_panel") : t("nav.show_panel")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-stone-400 transition-transform duration-300 {isVisible ? 'rotate-180 text-[#c48a3a]' : ''}"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
      <span
        class="mt-[1px] text-[0.55rem] font-bold tracking-widest uppercase {isVisible
          ? 'text-[#c48a3a]'
          : 'text-stone-400'}"
      >
        {t("nav.panel_filter")}
      </span>
    </button>
  </div>
{/if}
