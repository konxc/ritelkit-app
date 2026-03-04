<script lang="ts">
  import Button from "./ui/Button.svelte";
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

<div class="mt-8 flex items-center justify-between border-t border-stone-200/60 pt-6">
  <span class="rounded-md bg-stone-100/80 px-3 py-1.5 text-[0.85rem] font-semibold text-stone-500">
    Halaman <span class="font-bold text-stone-900">{page}</span> dari
    <span class="font-bold text-stone-900">{totalPages}</span>
  </span>
  <div class="flex items-center gap-2">
    <Button variant="simple" size="sm" href={prevHref} disabled={!prevHref} class="!px-3.5">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
      >
      <span class="hidden sm:inline">Sebelumnya</span>
    </Button>

    <Button variant="simple" size="sm" href={nextHref} disabled={!nextHref} class="!px-3.5">
      <span class="hidden sm:inline">Selanjutnya</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
      >
    </Button>
  </div>
</div>
