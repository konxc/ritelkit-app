<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import type { Snippet } from "svelte";

  interface Props {
    isOpen: boolean;
    onClose?: () => void;
    title: string;
    subtitle?: string;
    icon?: Snippet;
    children?: Snippet;
    footer?: Snippet;
    maxWidth?: "md" | "lg" | "xl" | "2xl" | string;
    zIndex?: number;
  }

  let {
    isOpen = $bindable(),
    onClose,
    title,
    subtitle,
    icon,
    children,
    footer,
    maxWidth = "md",
    zIndex = 110,
  }: Props = $props();

  const maxWidthClasses = {
    md: "lg:max-w-md",
    lg: "lg:max-w-lg",
    xl: "lg:max-w-xl",
    "2xl": "lg:max-w-2xl",
  };

  const resolvedMaxWidth = $derived(maxWidthClasses[maxWidth as keyof typeof maxWidthClasses] || maxWidth);

  const handleClose = () => {
    isOpen = false;
    onClose?.();
  };

  function portal(node: HTMLElement) {
    if (typeof document === "undefined") return;
    document.body.appendChild(node);
    return {
      destroy() {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      },
    };
  }
</script>

{#if isOpen}
  <div use:portal class="fixed inset-0 flex justify-end overflow-hidden" style="z-index: {zIndex};">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
      transition:fade={{ duration: 300 }}
      onclick={handleClose}
    ></div>

    <div
      class="relative flex h-full w-full flex-col bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.1)] focus:outline-none lg:shadow-[-8px_0_30px_rgba(0,0,0,0.05)] {resolvedMaxWidth}"
      style="z-index: {zIndex + 10};"
      transition:fly={{ x: 400, opacity: 1, duration: 400, delay: 50 }}
    >
      <!-- Header -->
      <div class="relative overflow-hidden border-b border-stone-100 bg-stone-50/80 px-5 py-4 lg:px-7 lg:py-6">
        <div
          class="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-stone-900/5 transition-transform hover:scale-110"
        ></div>
        <div class="relative flex items-center justify-between">
          <div>
            <h3 class="flex items-center gap-2 text-lg font-black tracking-tight text-stone-800 lg:text-xl">
              {#if icon}
                <span
                  class="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-white shadow-lg shadow-stone-900/20 lg:h-8 lg:w-8 lg:rounded-xl"
                >
                  {@render icon()}
                </span>
              {/if}
              {title}
            </h3>
            {#if subtitle}
              <p
                class="mt-0.5 text-[0.6rem] font-bold tracking-[0.05em] text-stone-400 uppercase lg:mt-1 lg:text-[0.65rem]"
              >
                {subtitle}
              </p>
            {/if}
          </div>
          <button
            class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-400 shadow-sm transition-all hover:bg-stone-100 hover:text-stone-800 focus:outline-none active:scale-90"
            onclick={handleClose}
            aria-label="Tutup Panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden">
        <div class="scrollbar-hide h-full w-full overflow-y-auto">
          {@render children?.()}
        </div>
      </div>

      <!-- Footer -->
      {#if footer}
        <div class="mt-auto border-t border-stone-100 bg-stone-50/10 p-5 pt-4 pb-6 lg:bg-white lg:p-6 lg:pt-5 lg:pb-8">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
