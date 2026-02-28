<script lang="ts">
import type { Snippet } from "svelte";

let { title, children }: { title: string; children?: Snippet } = $props();
</script>

<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8 mb-4 bg-white p-5 rounded-2xl border border-stone-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
  <div class="flex items-center gap-2.5">
    <div class="w-1.5 h-6 bg-[#c48a3a] rounded-full"></div>
    <h3 class="text-[1.05rem] font-extrabold text-stone-800 tracking-tight">{title}</h3>
  </div>
  <div class="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-1 md:pb-0 w-full md:w-auto">
    {@render children?.()}
  </div>
</div>
