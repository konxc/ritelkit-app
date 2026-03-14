<script lang="ts">
  // Mimic actions from astro (optional because this is a simulation file)
  import { fade, slide } from "svelte/transition";
  import Card from "@components/admin/ui/Card.svelte";
  import Button from "@components/admin/ui/Button.svelte";
  import { t, initI18n, i18n } from "@lib/i18n/store.svelte";
  import { onMount, untrack } from "svelte";

  let { initialData = [], lang } = $props<{
    initialData?: Array<{ id: string; name: string }>;
    lang?: any;
  }>();

  // Root call for SSR and initial hydration (untracked for Svelte 5)
  initI18n(untrack(() => lang));

  interface SimulationResult {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    growthRate: number;
  }

  let scenario = $state({
    marketingSpend: 1000000,
    newCustomers: 50,
    retentionRate: 80,
  });

  let results = $state<SimulationResult | null>(null);
  let isSimulating = $state(false);

  async function runSimulation() {
    isSimulating = true;
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    results = {
      totalRevenue: scenario.marketingSpend * (scenario.newCustomers / 10) * (scenario.retentionRate / 100),
      totalOrders: Math.floor(scenario.newCustomers * 1.5),
      avgOrderValue: 25000,
      growthRate: 15.5,
    };
    isSimulating = false;
  }

  onMount(() => {
    // Already inited
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="font-['Syne',sans-serif] text-2xl font-bold text-stone-900">{t("nav.simulasi")}</h1>
      <p class="text-sm text-stone-500">{t("common.simulasi_desc")}</p>
    </div>
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <Card title={t("common.parameters")}>
      <div class="space-y-4 pt-4">
        <div>
          <label class="mb-2 block text-sm font-medium text-stone-700" for="marketing"
            >{t("common.marketing_spend")}</label
          >
          <input
            id="marketing"
            type="range"
            min="500000"
            max="10000000"
            step="500000"
            bind:value={scenario.marketingSpend}
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-stone-200"
          />
          <div class="mt-1 text-right text-sm font-bold text-[#c48a3a]">
            {i18n.f.currency(scenario.marketingSpend)}
          </div>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-stone-700" for="customers"
            >{t("common.new_customers")}</label
          >
          <input
            id="customers"
            type="number"
            bind:value={scenario.newCustomers}
            class="block w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-2.5 text-sm focus:border-[#c48a3a] focus:ring-[#c48a3a]"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-stone-700" for="retention"
            >{t("common.retention_rate")} (%)</label
          >
          <input
            id="retention"
            type="number"
            min="0"
            max="100"
            bind:value={scenario.retentionRate}
            class="block w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-2.5 text-sm focus:border-[#c48a3a] focus:ring-[#c48a3a]"
          />
        </div>

        <Button variant="primary" class="w-full" onclick={runSimulation} disabled={isSimulating}>
          {#if isSimulating}
            {t("common.simulating")}...
          {:else}
            {t("common.run_simulation")}
          {/if}
        </Button>
      </div>
    </Card>

    {#if results}
      <div in:fade>
        <Card title={t("common.results")}>
          <div class="grid grid-cols-2 gap-4 pt-4">
            <div class="rounded-2xl bg-stone-50 p-4">
              <p class="text-xs text-stone-500">{t("common.total_revenue")}</p>
              <p class="text-lg font-bold text-stone-900">{i18n.f.currency(results.totalRevenue)}</p>
            </div>
            <div class="rounded-2xl bg-stone-50 p-4">
              <p class="text-xs text-stone-500">{t("common.total_orders")}</p>
              <p class="text-lg font-bold text-stone-900">{results.totalOrders}</p>
            </div>
            <div class="rounded-2xl bg-stone-50 p-4">
              <p class="text-xs text-stone-500">{t("common.avg_order")}</p>
              <p class="text-lg font-bold text-stone-900">{i18n.f.currency(results.avgOrderValue)}</p>
            </div>
            <div class="rounded-2xl bg-[#c48a3a]/10 p-4 text-[#c48a3a]">
              <p class="text-xs opacity-80">{t("common.growth_rate")}</p>
              <p class="text-lg font-bold">+{results.growthRate}%</p>
            </div>
          </div>
        </Card>
      </div>
    {:else}
      <div
        class="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-100 bg-stone-50/50 p-12 text-center"
      >
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-stone-300 shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg
          >
        </div>
        <p class="text-stone-500">{t("common.simulation_placeholder")}</p>
      </div>
    {/if}
  </div>
</div>
