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
  }

  let { q = "", categoryId = "", status = "", categoryOptions = [], tab = "produk" }: Props = $props();

  let showAdvanced = $state(false);
  let localQ = $state(q);
  let localCategoryId = $state(categoryId);
  let localStatus = $state(status);

  function syncFromUrl() {
    const params = new URLSearchParams(window.location.search);
    localQ = params.get("q") || "";
    localCategoryId = params.get("category") || "";
    localStatus = params.get("status") || "";
  }

  onMount(() => {
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  });

  let searchTimeout: ReturnType<typeof setTimeout>;

  const catOptions = [
    { label: "Semua Kategori", value: "" },
    ...categoryOptions.map((c) => ({ label: c.name, value: String(c.id) })),
  ];

  const statusOptions = [
    { label: "Semua Status", value: "" },
    { label: "Aktif", value: "active" },
    { label: "Tidak Aktif", value: "inactive" },
  ];

  let isUpdating = $state(false);

  function updateFilters() {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab || "produk");

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

    <!-- Mobile-only Filter Toggle -->
    <div class="relative lg:hidden">
      <Button
        variant="outline"
        class="flex min-w-[100px] items-center gap-2.5 rounded-xl border-stone-200 bg-white px-4"
        onclick={() => (showAdvanced = true)}
      >
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
          class="text-[#c48a3a]"
        >
          <path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
        </svg>
        <span class="font-bold text-stone-700">Filter</span>
        {#if activeFiltersCount > 0}
          <span
            class="animate-in zoom-in absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c48a3a] text-[10px] font-bold text-white shadow-lg ring-2 ring-white"
          >
            {activeFiltersCount}
          </span>
        {/if}
      </Button>
    </div>
  </div>

  <!-- Desktop Filters Panel -->
  <div class="hidden items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50/40 p-1.5 lg:flex">
    <div class="w-44">
      <SelectInput
        name="category"
        bind:value={localCategoryId}
        onchange={onFilterChange}
        options={catOptions}
        class="!border-none !bg-transparent !shadow-none"
      />
    </div>

    {#if tab === "produk"}
      <div class="h-6 w-px bg-stone-200" />
      <div class="w-36">
        <SelectInput
          name="status"
          bind:value={localStatus}
          onchange={onFilterChange}
          options={statusOptions}
          class="!border-none !bg-transparent !shadow-none"
        />
      </div>
    {/if}

    <div class="flex h-9 items-center justify-center px-4">
      <div class="h-2 w-2 animate-pulse rounded-full bg-[#c48a3a]/40"></div>
    </div>
  </div>

  <!-- Drawer for Mobile Filtering -->
  <AdminFilterDrawer
    bind:isOpen={showAdvanced}
    title="Filter Lanjutan"
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

      {#if tab === "produk"}
        <div class="space-y-4">
          <label for="status-select" class="text-[0.7rem] font-extrabold tracking-widest text-stone-400 uppercase"
            >Status Produk</label
          >
          <SelectInput name="status" bind:value={localStatus} options={statusOptions} />
        </div>
      {/if}
    </div>
  </AdminFilterDrawer>
</div>
