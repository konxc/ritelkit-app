<script lang="ts">
import AdsManager from "./AdsManager.svelte";
import CouponsManager from "./CouponsManager.svelte";
import CustomersManager from "./CustomersManager.svelte";
import QueryProvider from "../QueryProvider.svelte";

let {
  tab,
  q = "",
  page = 1,
  limit = 20,
  initialData,
}: {
  tab: string;
  q?: string;
  page?: number;
  limit?: number;
  initialData?: any;
} = $props();
</script>

<QueryProvider {initialData}>
	{#if tab === "pelanggan"}
		<CustomersManager {q} {page} {limit} initialRows={initialData?.rows} total={initialData?.total} />
	{:else if tab === "kupon"}
		<CouponsManager rows={initialData} />
	{:else if tab === "iklan"}
		<AdsManager rows={initialData} />
	{/if}
</QueryProvider>
