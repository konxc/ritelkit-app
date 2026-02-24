<script lang="ts">
  import TableWrap from "./TableWrap.svelte";

  let {
    tableClass = "table",
  }: {
    tableClass?: string;
  } = $props();
</script>

<TableWrap>
  <table class={tableClass}>
    <slot />
  </table>
</TableWrap>
