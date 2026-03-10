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
    page = 1,
    limit = 20,
    initialData = null,
    lang,
  }: {
    tab: string;
    q?: string;
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
