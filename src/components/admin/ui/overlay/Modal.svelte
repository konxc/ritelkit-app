<script lang="ts">
  import { onMount, type Snippet } from "svelte";

  interface Props {
    open?: boolean;
    title?: string;
    description?: string;
    inline?: boolean;
    class?: string;
    children?: Snippet;
    footer?: Snippet;
    [key: string]: any;
  }

  import { t } from "@/lib/i18n/store.svelte";

  let {
    open = $bindable(false),
    title = "",
    description = "",
    inline = false,
    class: className = "",
    children,
    footer,
    ...rest
  }: Props = $props();

  function close() {
    if (!inline) open = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && open && !inline) {
      close();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open || inline}
  {#if !inline}
    <!-- Backdrop (Only if not inline) -->
    <div
      class="animate-in fade-in fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-md transition-all duration-500"
      onclick={close}
      role="presentation"
    ></div>
  {/if}

  <!-- Modal Container -->
  <div
    class={inline
      ? "relative w-full max-w-sm"
      : "pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"}
  >
    <div
      class="relative w-full rounded-[2rem] border border-stone-200/60 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)] {inline
        ? ''
        : 'animate-in fade-in zoom-in-95 pointer-events-auto duration-300'} {className}"
      role="dialog"
      aria-modal={!inline}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      {...rest}
    >
      <div class="mb-5 flex items-center justify-between">
        {#if title}
          <h3 id="modal-title" class="font-['Syne',sans-serif] text-xl font-bold text-stone-900">
            {title}
          </h3>
        {/if}
        {#if !inline}
          <button
            onclick={close}
            class="group flex h-9 w-9 items-center justify-center rounded-full bg-stone-50 text-stone-400 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90"
            aria-label={t("design_system.close_modal")}
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
              class="transition-transform duration-300 group-hover:rotate-90"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        {:else}
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-stone-50 text-stone-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </div>
        {/if}
      </div>

      {#if description}
        <p id="modal-description" class="mb-6 text-sm text-stone-500">
          {description}
        </p>
      {/if}

      {#if children}
        <div class="mb-6">
          {@render children()}
        </div>
      {/if}

      {#if footer}
        <div class="mt-6 flex items-center justify-end gap-3">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
