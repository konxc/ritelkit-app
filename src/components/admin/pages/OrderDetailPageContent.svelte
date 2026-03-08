<script lang="ts">
import OrderDetailManager from "./OrderDetailManager.svelte";
import QueryProvider from "../QueryProvider.svelte";

let { order }: { order: Record<string, unknown> } = $props();
</script>

<QueryProvider>
  <OrderDetailManager order={order as never} />
</QueryProvider>
