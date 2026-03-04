<script lang="ts">
  import InvoiceDetailManager from "./InvoiceDetailManager.svelte";
  import QueryProvider from "../QueryProvider.svelte";

  let { invoice }: { invoice: Record<string, unknown> } = $props();
</script>

<QueryProvider>
  <InvoiceDetailManager invoice={invoice as never} />
</QueryProvider>
