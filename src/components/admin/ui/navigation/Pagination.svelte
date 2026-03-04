<script lang="ts">
  interface Props {
    currentPage?: number;
    totalPages?: number;
    class?: string;
    onPageChange?: (page: number) => void;
    [key: string]: any;
  }

  let { currentPage = $bindable(1), totalPages = 1, class: className = "", onPageChange, ...rest }: Props = $props();

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      currentPage = page;
      if (onPageChange) onPageChange(page);
    }
  }

  // Calculate pages to show
  let visiblePages = $derived.by(() => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  });
</script>

<div class="flex items-center gap-2 {className}" {...rest}>
  <button
    disabled={currentPage === 1}
    onclick={() => handlePageChange(currentPage - 1)}
    class="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-400 shadow-sm transition-all hover:border-[#c48a3a]/30 hover:bg-[#c48a3a]/5 hover:text-[#c48a3a] focus:ring-[3px] focus:ring-[#c48a3a]/20 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
    aria-label="Previous Page"
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
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  </button>

  {#each visiblePages as page}
    {#if page === "..."}
      <span class="px-2 text-stone-400">...</span>
    {:else}
      <button
        onclick={() => handlePageChange(page as number)}
        class="flex h-10 w-10 items-center justify-center rounded-xl font-semibold shadow-sm transition-all focus:ring-[3px] focus:ring-[#c48a3a]/20 active:scale-90 {page ===
        currentPage
          ? 'bg-[#c48a3a] font-bold text-white shadow-[0_4px_12px_rgba(196,138,58,0.25)]'
          : 'border border-stone-200 bg-white text-stone-600 hover:border-[#c48a3a]/30 hover:bg-[#c48a3a]/5 hover:text-[#c48a3a]'}"
        aria-current={page === currentPage ? "page" : undefined}
      >
        {page}
      </button>
    {/if}
  {/each}

  <button
    disabled={currentPage === totalPages}
    onclick={() => handlePageChange(currentPage + 1)}
    class="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm transition-all hover:border-[#c48a3a]/30 hover:bg-[#c48a3a]/5 hover:text-[#c48a3a] focus:ring-[3px] focus:ring-[#c48a3a]/20 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
    aria-label="Next Page"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  </button>
</div>
