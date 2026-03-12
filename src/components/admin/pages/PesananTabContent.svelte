<script lang="ts">
  import FulfillmentManager from "./FulfillmentManager.svelte";
  import InvoicesManager from "./InvoicesManager.svelte";
  import OrdersManager from "./OrdersManager.svelte";
  import RefundsManager from "./RefundsManager.svelte";
  import ShippingManager from "./ShippingManager.svelte";
  import QueryProvider from "../QueryProvider.svelte";
  import { initI18n } from "../../../lib/i18n/store.svelte";
  import { untrack } from "svelte";

  let {
    tab,
    q = "",
    status = "",
    page = 1,
    limit = 20,
    initialData = {},
    lang,
  }: {
    tab: string;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    initialData?: any;
    lang?: any;
  } = $props();

  // Root call for SSR and initial hydration (untracked for Svelte 5)
  initI18n(untrack(() => lang));
</script>

<QueryProvider {initialData}>
  {#if tab === "order"}
    <OrdersManager {q} {status} {page} {limit} {lang} rows={initialData.orders} total={initialData.ordersTotal} />
  {:else if tab === "fulfillment"}
    <FulfillmentManager
      {q}
      {status}
      {page}
      {limit}
      {lang}
      rows={initialData.shipments}
      total={initialData.shipmentsTotal}
    />
  {:else if tab === "shipping"}
    <ShippingManager {lang} rows={initialData.shippingRules} />
  {:else if tab === "invoice"}
    <InvoicesManager {q} {status} {page} {limit} {lang} rows={initialData.invoices} total={initialData.invoicesTotal} />
  {:else if tab === "refund"}
    <RefundsManager {q} {status} {page} {limit} {lang} rows={initialData.refunds} total={initialData.refundsTotal} />
  {/if}
</QueryProvider>
