<script lang="ts">
let {
	page,
	totalPages,
	prevHref,
	nextHref,
}: {
	page: number;
	totalPages: number;
	prevHref?: string;
	nextHref?: string;
} = $props();
</script>

<div class="flex items-center justify-between mt-8 border-t border-stone-200/60 pt-6">
  <span class="text-[0.85rem] font-semibold text-stone-500 bg-stone-100/80 px-3 py-1.5 rounded-md">
    Halaman <span class="text-stone-900 font-bold">{page}</span> dari <span class="text-stone-900 font-bold">{totalPages}</span>
  </span>
  <div class="flex items-center gap-2">
    {#if prevHref}
      <a 
        href={prevHref} 
        class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.85rem] font-bold text-stone-600 bg-white border border-stone-200 shadow-sm hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Sebelumnya
      </a>
    {:else}
      <span class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.85rem] font-bold text-stone-300 bg-stone-50 border border-stone-100 cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Sebelumnya
      </span>
    {/if}
    
    {#if nextHref}
      <a 
        href={nextHref} 
        class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.85rem] font-bold text-stone-600 bg-white border border-stone-200 shadow-sm hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 transition-all"
      >
        Selanjutnya
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </a>
    {:else}
      <span class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.85rem] font-bold text-stone-300 bg-stone-50 border border-stone-100 cursor-not-allowed">
        Selanjutnya
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </span>
    {/if}
  </div>
</div>
