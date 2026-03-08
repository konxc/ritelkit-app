<script lang="ts">
import FulfillmentManager from "./FulfillmentManager.svelte";
import InvoicesManager from "./InvoicesManager.svelte";
import OrdersManager from "./OrdersManager.svelte";
import RefundsManager from "./RefundsManager.svelte";
import ShippingManager from "./ShippingManager.svelte";
import QueryProvider from "../QueryProvider.svelte";

let {
  tab,
  q = "",
  page = 1,
  limit = 20,
  initialData = null,
}: {
  tab: string;
  q?: string;
  page?: number;
  limit?: number;
  initialData?: any;
} = $props();
</script>

<QueryProvider {initialData}>
  {#if tab === "order"}
    <OrdersManager {q} {page} {limit} rows={initialData?.rows || []} />
  {:else if tab === "fulfillment"}
    <FulfillmentManager rows={initialData?.rows || []} />
  {:else if tab === "shipping"}
    <ShippingManager rows={initialData?.rows || []} />
  {:else if tab === "invoice"}
    <InvoicesManager {page} {limit} rows={initialData?.rows || []} />
  {:else if tab === "refund"}
    <RefundsManager {page} {limit} rows={initialData?.rows || []} />
  {/if}
</QueryProvider>
