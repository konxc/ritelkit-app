<script lang="ts">
  import TableWrap from "./TableWrap.svelte";
  import type { Snippet } from 'svelte';

  let {
    tableClass = "table",
    class: className = "",
    children,
    ...rest
  }: {
    tableClass?: string;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  } = $props();
</script>

<TableWrap class={className} {...rest}>
  <table class={tableClass}>
    {@render children?.()}
  </table>
</TableWrap>
