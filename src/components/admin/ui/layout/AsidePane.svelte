<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import Button from "../Button.svelte";

  interface Props {
    title?: string;
    side?: "left" | "right";
    children?: import("svelte").Snippet;
    /** Optional custom trigger snippet. If not provided, a default FAB will be rendered on mobile. */
    trigger?: import("svelte").Snippet<[{ toggle: () => void; isOpen: boolean }]>;
    /** Desktop width */
    width?: string;
    /** Sticky top offset */
    top?: string;
    /** Class for the desktop container */
    class?: string;
    isOpen?: boolean;
  }

  let {
    title = "Navigation",
    side = "right",
    children,
    trigger,
    width = "240px",
    top = "2.5rem",
    class: className = "",
    isOpen = $bindable(false),
  }: Props = $props();

  function toggle() {
    isOpen = !isOpen;
  }

  $effect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  });

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      },
    };
  }

  const sideClasses = $derived(side === "right" ? "right-0" : "left-0");
  const flyOffset = $derived(side === "right" ? 300 : -300);
</script>

<!-- Desktop View: Sticky Sidebar -->
<aside
  style="width: {width}; top: {top};"
  class="sticky z-10 hidden h-auto shrink-0 flex-col rounded-3xl border border-stone-200/60 bg-white/50 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] backdrop-blur-2xl xl:flex {className}"
>
  {#if children}
    {@render children()}
  {/if}
</aside>

<!-- Mobile View (Portal out of standard flow to avoid transform stacking context) -->
<div use:portal class="xl:hidden">
  <!-- Mobile View: Toggle Button (FAB) -->
  {#if trigger}
    {@render trigger({ toggle, isOpen })}
  {:else}
    <Button
      variant="secondary"
      class="fixed bottom-24 xl:hidden {side === 'right'
        ? 'right-6'
        : 'left-6'} top-auto z-[100] flex h-14 w-14 items-center justify-center !rounded-full p-0 shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-transform hover:scale-105 active:scale-95"
      onclick={toggle}
      aria-label="Toggle {title}"
    >
      {#if isOpen}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg
        >
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line
            x1="8"
            y1="18"
            x2="21"
            y2="18"
          ></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line
            x1="3"
            y1="18"
            x2="3.01"
            y2="18"
          ></line></svg
        >
      {/if}
    </Button>
  {/if}

  <!-- Mobile View: Drawer & Backdrop -->
  {#if isOpen}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      transition:fade={{ duration: 200 }}
      onclick={toggle}
      class="fixed inset-0 z-[101] bg-stone-900/40 backdrop-blur-sm xl:hidden"
    ></div>

    <!-- Drawer Container -->
    <aside
      transition:fly={{ x: flyOffset, duration: 300, opacity: 1 }}
      class="fixed inset-y-0 {sideClasses} z-[102] flex h-full w-[280px] flex-col bg-white shadow-2xl xl:hidden"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-stone-100 p-6">
        <h3 class="font-['Syne',sans-serif] text-base font-bold tracking-wider text-stone-900 uppercase">
          {title}
        </h3>
        <Button variant="ghost" size="icon" class="bg-stone-100 text-stone-500 hover:text-stone-900" onclick={toggle}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg
          >
        </Button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-6">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </aside>
  {/if}
</div>
