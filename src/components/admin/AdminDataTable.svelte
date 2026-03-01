<script lang="ts">
import type { Snippet } from "svelte";
import TableWrap from "./TableWrap.svelte";

let {
  class: className = "",
  children,
  ...rest
}: {
  class?: string;
  children?: Snippet;
  [key: string]: unknown;
} = $props();
</script>

<TableWrap class={className} {...rest}>
  <table class="admin-table-core w-full text-left border-collapse min-w-max">
    {@render children?.()}
  </table>
</TableWrap>


