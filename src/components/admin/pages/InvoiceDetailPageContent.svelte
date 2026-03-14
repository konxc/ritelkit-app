<script lang="ts">
  import InvoiceDetailManager from "@/components/admin/pages/InvoiceDetailManager.svelte";
  import QueryProvider from "@/components/admin/QueryProvider.svelte";

  let { invoice, lang }: { invoice: Record<string, unknown>; lang?: any } = $props();
</script>

<QueryProvider>
  <InvoiceDetailManager invoice={invoice as never} {lang} />
</QueryProvider>
