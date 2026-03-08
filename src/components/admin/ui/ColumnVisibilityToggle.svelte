<script lang="ts">
import Popover from "./overlay/Popover.svelte";

interface Column {
  id: string;
  label: string;
  isVisible: boolean;
}

let { columns = $bindable() }: { columns: Column[] } = $props();
</script>

<Popover>
  {#snippet buttonContent()}
    <button
      class="flex h-10 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold text-stone-600 shadow-sm ring-1 ring-stone-200 transition-all ring-inset hover:bg-stone-50 lg:h-11"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-4 w-4 text-stone-400"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
        <line x1="9" x2="9" y1="3" y2="21"></line>
      </svg>
      Kolom
    </button>
  {/snippet}

  <div class="flex min-w-[160px] flex-col gap-1 p-1">
    <div
      class="mb-1 border-b border-stone-100 px-2 pt-1 pb-2 text-[10px] font-black tracking-widest text-stone-400 uppercase"
    >
      Tampilkan Kolom
    </div>
    {#each columns as col}
      <label
        class="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50"
      >
        <input
          type="checkbox"
          bind:checked={col.isVisible}
          class="h-4 w-4 rounded border-stone-300 text-[#c48a3a] transition-all focus:ring-[#c48a3a]"
        />
        {col.label}
      </label>
    {/each}
  </div>
</Popover>
