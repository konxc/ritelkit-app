<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";

  let {
    title,
    children,
    class: className = "",
  }: {
    title: string;
    children?: Snippet;
    class?: string;
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
  });

  function toggle() {
    isVisible = !isVisible;
    const storageKey = `catalog_toolbar_${title.toLowerCase().replace(/\s+/g, "_")}`;
    localStorage.setItem(storageKey, String(isVisible));
  }
</script>

<div
  class="z-20 mb-6 flex flex-col justify-between gap-5 rounded-[2rem] border border-stone-200/60 bg-white/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all duration-300 md:flex-row md:items-center lg:p-6 {className} {!isVisible &&
  hasChecked
    ? 'pb-4'
    : ''}"
>
  <div class="flex items-center justify-between gap-2.5">
    <div class="flex items-center gap-2.5">
      <div class="h-6 w-1.5 rounded-full bg-[#c48a3a]"></div>
      <h3 class="text-[1.05rem] font-extrabold tracking-tight text-stone-800">{title}</h3>
    </div>

    <!-- Toggle Button -->
    <button
      type="button"
      onclick={toggle}
      class="flex h-8 w-8 items-center justify-center rounded-full bg-stone-50 text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-600 active:scale-90"
      title={isVisible ? "Sembunyikan Filter" : "Tampilkan Filter"}
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
