<script lang="ts">
  let {
    q = "",
    status = "",
    categoryId = "",
    tab = "ads",
    lang,
    columns = $bindable([]),
    categoryOptions = [],
  }: {
    q?: string;
    status?: string;
    categoryId?: string;
    tab?: string;
    lang?: any;
    columns?: { id: string; label: string; isVisible: boolean }[];
    categoryOptions?: { id: string | number; name: string }[];
  } = $props();
  initI18n(untrack(() => lang));

  import SearchInput from "./ui/forms/SearchInput.svelte";
  import SelectInput from "./ui/forms/SelectInput.svelte";
  import Button from "./ui/Button.svelte";
  import AdminFilterDrawer from "./ui/forms/AdminFilterDrawer.svelte";
  import ColumnVisibilityToggle from "./ui/ColumnVisibilityToggle.svelte";
  import { onMount, untrack } from "svelte";
  import { t, initI18n } from "../../lib/i18n/store.svelte";

  // Root call for SSR and initial hydration (untracked for Svelte 5)

  let showAdvanced = $state(false);
  let localQ = $state(q);
  let localStatus = $state(status);
  let localCategoryId = $state(categoryId);
  let localSubtab = $state("");

  function syncFromUrl() {
    const params = new URLSearchParams(window.location.search);
    localQ = params.get("q") || "";
    localStatus = params.get("status") || "";
    localCategoryId = params.get("category") || "";
    localSubtab = params.get("subtab") || "";
  }

  onMount(() => {
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
    };
  });

  $effect(() => {
    if (showAdvanced === false) {
      syncFromUrl();
    }
  });

  let searchTimeout: ReturnType<typeof setTimeout>;

  const getStatusOptions = (tab: string) => {
    const base = [{ label: t("common.all_statuses"), value: "" }];
    if (tab === "ads") {
      return [
        ...base,
        { label: t("ads.status_draft"), value: "draft" },
        { label: t("ads.status_active"), value: "active" },
        { label: t("ads.status_paused"), value: "paused" },
        { label: t("ads.status_completed"), value: "completed" },
      ];
    }
    if (tab === "coupons") {
      return [
        ...base,
        { label: t("coupons.active"), value: "active" },
        { label: t("coupons.inactive"), value: "inactive" },
      ];
    }
    if (tab === "products") {
      return [
        ...base,
        { label: t("common.active"), value: "active" },
        { label: t("common.inactive"), value: "inactive" },
      ];
    }
    if (tab === "order" || tab === "orders") {
      return [
        ...base,
        { label: t("status.pending"), value: "pending" },
        { label: t("status.processing"), value: "processing" },
        { label: t("status.shipped"), value: "shipped" },
        { label: t("status.delivered"), value: "delivered" },
        { label: t("status.cancelled"), value: "cancelled" },
        { label: t("status.refunded"), value: "refunded" },
      ];
    }
    if (tab === "fulfillment") {
      return [
        ...base,
        { label: t("status.packing"), value: "packing" },
        { label: t("status.shipped"), value: "shipped" },
        { label: t("status.delivered"), value: "delivered" },
        { label: t("status.cancelled"), value: "cancelled" },
      ];
    }
    if (tab === "invoice" || tab === "invoices") {
      return [
        ...base,
        { label: t("status.pending"), value: "pending" },
        { label: t("status.paid"), value: "paid" },
        { label: t("status.void"), value: "void" },
      ];
    }
    if (tab === "refund" || tab === "refunds") {
      return [
        ...base,
        { label: t("status.pending"), value: "pending" },
        { label: t("status.processing"), value: "processing" },
        { label: t("status.completed"), value: "completed" },
        { label: t("status.failed"), value: "failed" },
      ];
    }
    if (tab === "shipping") {
      return [
        ...base,
        { label: t("common.active"), value: "active" },
        { label: t("common.inactive"), value: "inactive" },
      ];
    }
    if (tab === "notifications") {
      return [
        ...base,
        { label: t("status.pending"), value: "pending" },
        { label: t("status.sent"), value: "sent" },
        { label: t("status.failed"), value: "failed" },
      ];
    }
    if (tab === "content" || tab === "categories") {
      return [
        ...base,
        { label: t("common.active"), value: "active" },
        { label: t("common.inactive"), value: "inactive" },
      ];
    }
    return base;
  };

  let statusOptions = $derived(getStatusOptions(tab || "ads"));
  let catOptions = $derived([
    { label: t("common.all_categories"), value: "" },
    ...categoryOptions.map((c) => ({ label: c?.name || "", value: String(c?.id || "") })),
  ]);

  let isUpdating = $state(false);

  function updateFilters() {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab || "ads");

    if (localQ) url.searchParams.set("q", localQ);
    else url.searchParams.delete("q");

    if (localStatus) url.searchParams.set("status", localStatus);
    else url.searchParams.delete("status");

    if (localCategoryId) url.searchParams.set("category", localCategoryId);
    else url.searchParams.delete("category");

    // Reset to page 1 on filter change
    url.searchParams.set("page", "1");

    // Soft update URL without triggering Astro navigation
    window.history.replaceState({}, "", url.href);

    // Notify listeners
    window.dispatchEvent(new PopStateEvent("popstate"));

    isUpdating = false;
  }

  function onSearchInput(e: Event & { currentTarget: HTMLInputElement }) {
    localQ = e.currentTarget.value;
    isUpdating = true;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(updateFilters, 400);
  }

  function onFilterChange() {
    isUpdating = true;
    updateFilters();
  }

  let tabLabels = $derived({
    ads: t("ads.title_list"),
    coupons: t("coupons.title_list"),
    customers: t("customers.title_list"),
    notifications: t("system.notifications"),
    admins: t("system.admins"),
    audit: t("system.audit"),
    content: t("system.content"),
    products: t("nav.catalog"),
    inventory: t("catalog.inventory.stock_tab"),
    fulfillment: t("fulfillment.title_list"),
    refund: t("refunds.title_list"),
    shipping: t("shipping_rules.title_list"),
    order: t("orders.title_list") || "Orders",
    invoice: t("invoices.title_list") || "Invoices",
    categories: t("catalog.categories.title") || "Categories",
  } as Record<string, string>);
  let tabLabel = $derived(tabLabels[tab || "ads"] || tab || "");

  function toggleColumn(id: string) {
    if (!columns) return;
    const target = columns.find((col: any) => col.id === id);
    if (target) {
      target.isVisible = !target.isVisible;
    }
  }
</script>

<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-3">
  <!-- Main Search Area -->
  <div class="flex items-center gap-2">
    <div class="group relative lg:w-64">
      <SearchInput
        name="q"
        value={localQ}
        oninput={onSearchInput}
        placeholder={t("common.search")}
        autocomplete="one-time-code"
      />
    </div>
    <div class="lg:hidden">
      <Button variant="outline" size="sm" onclick={() => (showAdvanced = true)} class="px-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
        </svg>
        <span class="text-[0.7rem] font-bold tracking-widest uppercase">{t("common.filter")}</span>
      </Button>
    </div>
  </div>

  <!-- Desktop Filters Panel -->
  <div class="hidden items-center gap-3 lg:flex">
    <div class="mr-1 h-8 w-px bg-stone-200/60"></div>

    {#if categoryOptions.length > 0 && localSubtab !== "log"}
      <div class="w-44">
        <SelectInput
          name="category"
          bind:value={localCategoryId}
          onchange={onFilterChange}
          options={catOptions}
          class="bg-stone-50/50 hover:bg-white"
        />
      </div>
    {/if}

    {#if ["ads", "coupons", "products", "order", "fulfillment", "invoice", "refund", "shipping", "notifications", "content", "categories"].includes(tab || "ads")}
      <div class="w-44">
        <SelectInput
          name="status"
          bind:value={localStatus}
          onchange={onFilterChange}
          options={statusOptions}
          class="bg-stone-50/50 hover:bg-white"
        />
      </div>
    {/if}

    {#if columns?.length}
      <ColumnVisibilityToggle bind:columns />
    {/if}
  </div>

  {#snippet filterHeaderIcon()}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  {/snippet}

  <AdminFilterDrawer
    bind:isOpen={showAdvanced}
    title={t("common.filter_advanced")}
    subtitle={`${t("common.customize")} ${tabLabel}`}
    icon={filterHeaderIcon}
    onApply={() => {
      showAdvanced = false;
      updateFilters();
    }}
  >
    <div class="grid gap-6 py-4">
      {#if categoryOptions.length > 0 && localSubtab !== "log"}
        <div class="space-y-4">
          <label for="category-select" class="text-[0.7rem] font-extrabold tracking-widest text-stone-400 uppercase"
            >{t("catalog.products.category")}</label
          >
          <SelectInput name="category" bind:value={localCategoryId} options={catOptions} />
        </div>
      {/if}

      {#if ["ads", "coupons", "products", "order", "fulfillment", "invoice", "refund", "shipping", "notifications", "content", "categories"].includes(tab || "ads")}
        <div class="space-y-4">
          <label for="status-select" class="text-[0.7rem] font-extrabold tracking-widest text-stone-400 uppercase"
            >{t("common.status")}</label
          >
          <SelectInput name="status" bind:value={localStatus} options={statusOptions} />
        </div>
      {/if}

      {#if columns?.length}
        <div class="space-y-4">
          <span class="text-[0.7rem] font-extrabold tracking-widest text-stone-400 uppercase"
            >{t("common.columns")}</span
          >
          <div class="grid gap-2">
            {#each columns as col (col.id)}
              <label
                class="flex items-center gap-3 rounded-xl border border-stone-100 bg-white px-3 py-2 text-sm font-semibold text-stone-600"
              >
                <input
                  type="checkbox"
                  checked={col.isVisible}
                  onchange={() => toggleColumn(col.id)}
                  class="h-4 w-4 rounded border-stone-300 text-[#c48a3a] transition-all focus:ring-[#c48a3a]"
                />
                {col.label}
              </label>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </AdminFilterDrawer>
</div>
