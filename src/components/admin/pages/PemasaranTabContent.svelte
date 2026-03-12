<script lang="ts">
  import AdsManager from "./AdsManager.svelte";
  import CouponsManager from "./CouponsManager.svelte";
  import CustomersManager from "./CustomersManager.svelte";
  import QueryProvider from "../QueryProvider.svelte";
  import { initI18n } from "../../../lib/i18n/store.svelte";
  import { untrack } from "svelte";

  let {
    tab,
    q = "",
    page = 1,
    limit = 20,
    initialData,
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
  {#if tab === "customers"}
    <CustomersManager {q} {page} {limit} initialRows={initialData?.rows || initialData?.data} total={initialData?.total} />
  {:else if tab === "coupons"}
    <CouponsManager rows={initialData?.data} total={initialData?.total} {q} {page} {limit} {lang} />
  {:else if tab === "ads"}
    <AdsManager rows={initialData?.data} total={initialData?.total} {q} {page} {limit} {lang} />
  {/if}
</QueryProvider>
