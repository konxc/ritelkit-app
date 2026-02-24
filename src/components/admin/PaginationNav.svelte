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

<div class="pagination">
  {#if prevHref}
    <a href={prevHref}>Prev</a>
  {/if}
  <span class="muted">Hal {page} / {totalPages}</span>
  {#if nextHref}
    <a href={nextHref}>Next</a>
  {/if}
</div>
