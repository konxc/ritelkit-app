<script lang="ts">
  interface Props {
    onclick?: () => void;
    icon?: import("svelte").Snippet;
    label?: string;
    class?: string;
  }

  let { onclick, icon, label, class: className = "" }: Props = $props();
</script>

<div class={`fixed right-5 bottom-[100px] z-[45] lg:hidden ${className}`}>
  <button
    onclick={(e) => onclick?.()}
    class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c48a3a] to-[#a6722d] text-white shadow-[0_10px_25px_rgba(196,138,58,0.5)] transition-all active:scale-95"
    aria-label={label}
  >
    {#if icon}
      {@render icon()}
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
    {/if}
  </button>
</div>
