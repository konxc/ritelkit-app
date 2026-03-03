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
      class="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 animate-fade-in"
      onclick={close}
      role="presentation"
    ></div>
  {/if}

  <!-- Modal Container -->
  <div class="{inline ? 'relative w-full max-w-sm' : 'fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none'}">
    <div 
      class="w-full bg-white rounded-3xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-stone-200/60 relative {inline ? '' : 'pointer-events-auto animate-fade-in-up'} {className}"
      role="dialog"
      aria-modal={!inline}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      {...rest}
    >
      <div class="flex items-center justify-between mb-4">
        {#if title}
          <h3 id="modal-title" class="font-bold text-lg text-stone-900 font-['Syne',sans-serif]">
            {title}
          </h3>
        {/if}
        {#if !inline}
          <button
            onclick={close}
            class="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        {:else}
          <div class="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </div>
        {/if}
      </div>

      {#if description}
        <p id="modal-description" class="text-sm text-stone-500 mb-6">
          {description}
        </p>
      {/if}

      {#if children}
        <div class="mb-6">
          {@render children()}
        </div>
      {/if}

      {#if footer}
        <div class="flex items-center justify-end gap-3 mt-6">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
