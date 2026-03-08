<script lang="ts">
  import SearchInput from "./ui/forms/SearchInput.svelte";
  import SelectInput from "./ui/forms/SelectInput.svelte";
  import Button from "./ui/Button.svelte";
  import AdminFilterDrawer from "./ui/forms/AdminFilterDrawer.svelte";
  import { onMount } from "svelte";

  interface Props {
    q?: string;
    categoryId?: string;
    status?: string;
    categoryOptions?: any[];
    tab?: string;
    columns?: { id: string; label: string; isVisible: boolean }[];
  }

  let {
    q = "",
    categoryId = "",
    status = "",
    categoryOptions = [],
    tab = "products",
    columns,
  }: Props = $props();

  let showAdvanced = $state(false);
  let localQ = $state("");
  let localCategoryId = $state("");
  let localStatus = $state("");

  function syncFromUrl() {
    const params = new URLSearchParams(window.location.search);
    localQ = params.get("q") || "";
    localCategoryId = params.get("category") || "";
    localStatus = params.get("status") || "";
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

  let catOptions = $derived([
    { label: "Semua Kategori", value: "" },
    ...categoryOptions.map((c) => ({ label: c.name, value: String(c.id) })),
  ]);

  const statusOptions = [
    { label: "Semua Status", value: "" },
    { label: "Aktif", value: "active" },
    { label: "Tidak Aktif", value: "inactive" },
  ];

  let isUpdating = $state(false);

  function updateFilters() {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab || "products");

    if (localQ) url.searchParams.set("q", localQ);
    else url.searchParams.delete("q");

    if (localCategoryId) url.searchParams.set("category", localCategoryId);
    else url.searchParams.delete("category");

    if (localStatus) url.searchParams.set("status", localStatus);
    else url.searchParams.delete("status");

    // Reset to page 1 on filter change
    url.searchParams.set("page", "1");

    // Soft update URL without triggering Astro navigation
    window.history.replaceState({}, "", url.href);

    // Notify listeners (like ProductsManager)
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

  let activeFiltersCount = $derived(
    [localCategoryId, localStatus].filter((v) => v !== "" && v !== undefined && v !== null).length,
  );

  const tabLabels: Record<string, string> = {
    products: "Produk",
    categories: "Kategori",
    inventory: "Inventory",
  };
  let tabLabel = $derived(tabLabels[tab] || tab);

  function toggleColumn(id: string) {
    if (!columns) return;
    const target = columns.find((col) => col.id === id);
    if (target) {
      target.isVisible = !target.isVisible;
    }
  }
</script>

<div class="flex w-full flex-col gap-4 lg:flex-row lg:items-center">
  <!-- Main Search Area -->
  <div class="flex items-center gap-2 lg:flex-1">
    <div class="group relative flex-1">
      <SearchInput
        name="q"
        value={localQ}
        oninput={onSearchInput}
        placeholder={tab === "inventory" ? "Cari nama / SKU..." : "Cari produk..."}
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
        <span class="text-[0.7rem] font-bold tracking-widest uppercase">Filter</span>
      </Button>
    </div>
  </div>

  <!-- Desktop Filters Panel -->
  <div class="hidden items-center gap-3 lg:flex">
    <div class="w-44">
      <SelectInput
        name="category"
        bind:value={localCategoryId}
        onchange={onFilterChange}
        options={catOptions}
        class="bg-stone-50/50 hover:bg-white"
      />
    </div>

    {#if tab === "products"}
      <div class="w-36">
        <SelectInput
          name="status"
          bind:value={localStatus}
          onchange={onFilterChange}
          options={statusOptions}
          class="bg-stone-50/50 hover:bg-white"
        />
      </div>
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

  <!-- Drawer for Mobile Filtering -->
  <AdminFilterDrawer
    bind:isOpen={showAdvanced}
    title="Filter Lanjutan"
    subtitle={`Kustomisasi Tampilan Data ${tabLabel}`}
    icon={filterHeaderIcon}
    onApply={() => {
      showAdvanced = false;
      updateFilters();
    }}
  >
    <div class="grid gap-6 py-4">
      <div class="space-y-4">
        <label for="category-select" class="text-[0.7rem] font-extrabold tracking-widest text-stone-400 uppercase"
          >Kategori</label
        >
        <SelectInput name="category" bind:value={localCategoryId} options={catOptions} />
      </div>

      {#if tab === "products"}
        <div class="space-y-4">
          <label for="status-select" class="text-[0.7rem] font-extrabold tracking-widest text-stone-400 uppercase"
            >Status Produk</label
          >
          <SelectInput name="status" bind:value={localStatus} options={statusOptions} />
        </div>
      {/if}

      {#if columns?.length}
        <div class="space-y-4">
          <label class="text-[0.7rem] font-extrabold tracking-widest text-stone-400 uppercase"
            >Kolom</label
          >
          <div class="grid gap-2">
            {#each columns as col}
              <label
                class="flex items-center gap-3 rounded-xl border border-stone-100 bg-white px-3 py-2 text-sm font-semibold text-stone-600"
              >
                <input
                  type="checkbox"
                  checked={col.isVisible}
                  on:change={() => toggleColumn(col.id)}
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
