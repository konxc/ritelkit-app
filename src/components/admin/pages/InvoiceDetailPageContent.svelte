<script lang="ts">
  import InvoiceDetailManager from "./InvoiceDetailManager.svelte";
  import QueryProvider from "../QueryProvider.svelte";

  let { invoice, lang }: { invoice: Record<string, unknown>; lang?: any } = $props();
</script>

<QueryProvider>
  <InvoiceDetailManager invoice={invoice as never} {lang} />
</QueryProvider>
