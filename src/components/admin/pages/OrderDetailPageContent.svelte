<script lang="ts">
  import OrderDetailManager from "@/components/admin/pages/OrderDetailManager.svelte";
  import QueryProvider from "@/components/admin/QueryProvider.svelte";

  let { order }: { order: Record<string, unknown> } = $props();
</script>

<QueryProvider>
  <OrderDetailManager order={order as never} />
</QueryProvider>
