<script lang="ts">
  let {
    tab,
    q = "",
    status = "",
    page = 1,
    limit = 20,
    initialData,
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
  initI18n(untrack(() => lang));

  import AdsManager from "@/components/admin/pages/AdsManager.svelte";
  import CouponsManager from "@/components/admin/pages/CouponsManager.svelte";
  import CustomersManager from "@/components/admin/pages/CustomersManager.svelte";
  import QueryProvider from "@/components/admin/QueryProvider.svelte";
  import { initI18n } from "@/lib/i18n/store.svelte";
  import { untrack } from "svelte";

  // Root call for SSR and initial hydration (untracked for Svelte 5)
</script>

<QueryProvider {initialData}>
  {#if tab === "customers"}
    <CustomersManager
      {q}
      {status}
      {page}
      {limit}
      initialRows={initialData?.rows || initialData?.data}
      total={initialData?.total}
    />
  {:else if tab === "coupons"}
    <CouponsManager rows={initialData?.data} total={initialData?.total} {q} {status} {page} {limit} {lang} />
  {:else if tab === "ads"}
    <AdsManager rows={initialData?.data} total={initialData?.total} {q} {status} {page} {limit} {lang} />
  {/if}
</QueryProvider>
