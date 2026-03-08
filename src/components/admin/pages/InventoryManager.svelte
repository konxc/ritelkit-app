<script lang="ts">
  import { onMount } from "svelte";
  import { trpc } from "../../../lib/trpc";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import InlineEditableField from "../ui/forms/InlineEditableField.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import Textarea from "../ui/forms/Textarea.svelte";
  import { fly } from "svelte/transition";
  import { normalizeTab } from "../../../lib/admin";
  import Fab from "../ui/Fab.svelte";
  import Badge from "../ui/Badge.svelte";
  import Drawer from "../ui/overlay/Drawer.svelte";
  import CatalogHeaderFilters from "../CatalogHeaderFilters.svelte";
  import ColumnVisibilityToggle from "../ui/ColumnVisibilityToggle.svelte";

  let stockColumns = $state([
    { id: "produk", label: "Produk", isVisible: true, class: "" },
    { id: "sku", label: "SKU Code", isVisible: true, class: "" },
    { id: "stok", label: "Ketersediaan Stok", isVisible: true, class: "" },
    { id: "harga", label: "Harga Aktual", isVisible: true, class: "" },
  ]);

  let logColumns = $state([
    { id: "produk", label: "Produk", isVisible: true, class: "" },
    { id: "tipe", label: "Aktivitas", isVisible: true, class: "" },
    { id: "qty", label: "Qty", isVisible: true, class: "" },
    { id: "ref", label: "Ref", isVisible: true, class: "hidden lg:table-cell" },
    { id: "catatan", label: "Catatan", isVisible: true, class: "hidden lg:table-cell" },
    { id: "waktu", label: "Waktu", isVisible: true, class: "" },
  ]);

  let activeStockHeaders = $derived(
    stockColumns.filter((c) => c.isVisible).map((c) => ({ label: c.label, class: c.class })),
  );
  let activeLogHeaders = $derived(
    logColumns.filter((c) => c.isVisible).map((c) => ({ label: c.label, class: c.class })),
  );

  type InventoryProductRow = {
    id: string;
    sku?: string | null;
    name: string;
    stock?: number | null;
    price?: number | null;
  };

  type InventoryMovement = {
    id: string;
    productId: string;
    type: string;
    qty: number;
    notes: string | null;
    refOrderNo: string | null;
    createdAt: string;
    product_name: string | null;
  };

  type MovementInput = {
    productId: string;
    type: "in" | "out" | "adjustment";
    qty: number;
    notes?: string;
  };

  let {
    products: initialProducts = [],
    productsTotal: initialProductsTotal = 0,
    movements: initialMovements = [],
    movementsTotal: initialMovementsTotal = 0,
    categories = [],
  }: {
    products?: InventoryProductRow[];
    productsTotal?: number;
    movements?: InventoryMovement[];
    movementsTotal?: number;
    categories?: { id: string | number; name: string }[];
  } = $props();

  const queryClient = useQueryClient();
  let toastRef = $state<ToastNotification>();
  let isSubmitting = $state(false);
  let isDrawerOpen = $state(false);
  let activeSubTab = $state("stock");

  // Reactive filters from URL
  let q = $state("");
  let page = $state(1);
  const limit = 20;

  function syncFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    q = params.get("q") || "";
    const rawSubtab = params.get("subtab");
    activeSubTab = normalizeTab(rawSubtab, {
      allowed: ["stock", "log"],
      defaultTab: "stock",
      aliases: {
        stocks: "stock",
        logs: "log",
        history: "log",
      },
    });
    if (rawSubtab && rawSubtab !== activeSubTab) {
      const url = new URL(window.location.href);
      url.searchParams.set("subtab", activeSubTab);
      window.history.replaceState({}, "", url.href);
    }
    page = parseInt(params.get("page") || "1", 10);
  }

  onMount(() => {
    syncFiltersFromUrl();
    window.addEventListener("popstate", syncFiltersFromUrl);
    window.addEventListener("astro:after-navigation", syncFiltersFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFiltersFromUrl);
      window.removeEventListener("astro:after-navigation", syncFiltersFromUrl);
    };
  });

  const productsQuery = createQuery(() => ({
    queryKey: ["inventory.products.list", { q, page, limit }],
    queryFn: () => trpc.inventory.listProducts.query({ q, page, limit }),
    initialData: q === "" && page === 1 ? { data: initialProducts, total: initialProductsTotal } : undefined,
    placeholderData: (prev) => prev,
  }));

  const movementsQuery = createQuery(() => ({
    queryKey: ["inventory.movements.list", { q, page, limit }],
    queryFn: () => trpc.inventory.listMovements.query({ q, page, limit }),
    initialData: q === "" && page === 1 ? { data: initialMovements, total: initialMovementsTotal } : undefined,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  }));

  let currentProducts = $derived((productsQuery.data?.data as InventoryProductRow[]) || initialProducts);
  let currentMovements = $derived((movementsQuery.data?.data as InventoryMovement[]) || initialMovements);

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    isSubmitting = true;
    try {
      await trpc.inventory.createMovement.mutate({
        productId: data.get("product_id") as string,
        type: String(data.get("type") || "in") as MovementInput["type"],
        qty: Number(data.get("qty")),
        notes: (data.get("notes") as string) || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ["inventory.products.list"] });
      queryClient.invalidateQueries({ queryKey: ["inventory.movements.list"] });

      toastRef?.show("Stok berhasil diperbarui!", "success");
      form.reset();
      isDrawerOpen = false;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toastRef?.show(message, "error");
    } finally {
      isSubmitting = false;
    }
  };

  const handleUpdateStock = async (id: string, newStockRaw: string) => {
    const qty = Number(newStockRaw.trim());
    if (Number.isNaN(qty)) {
      toastRef?.show("Stock must be a number", "error");
      return;
    }

    try {
      await trpc.inventory.createMovement.mutate({
        productId: id,
        type: "adjustment",
        qty: qty,
        notes: "Penyesuaian stok manual via tabel",
      });

      queryClient.invalidateQueries({ queryKey: ["inventory.products.list"] });
      queryClient.invalidateQueries({ queryKey: ["inventory.movements.list"] });
      toastRef?.show("Stok berhasil di-update", "success");
    } catch (error: unknown) {
      toastRef?.show("Failed to update stock", "error");
    }
  };

  const fieldIds = {
    product: "inventory-product",
    type: "inventory-type",
    qty: "inventory-qty",
    notes: "inventory-notes",
  };
</script>

<div class="mt-2 mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
  <div>
    <SectionHeader
      title={activeSubTab === "stock" ? "Stok Produk Aktual" : "Log Mutasi Terakhir"}
      muted={activeSubTab === "stock"
        ? "Klik nominal stok untuk edit & Enter/Blur untuk simpan"
        : "30 riwayat stok terbaru"}
    />

    <!-- Sub-Tabs Navigation -->
    <div class="no-scrollbar mt-4 flex items-center gap-2 overflow-x-auto pb-1">
      <button
        onclick={() => {
          activeSubTab = "stock";
          const url = new URL(window.location.href);
          url.searchParams.set("subtab", "stock");
          window.history.pushState({}, "", url.href);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }}
        class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.85rem] font-bold whitespace-nowrap transition-all duration-300 active:scale-95 {activeSubTab ===
        'stock'
          ? 'bg-[#c48a3a] text-white shadow-[0_4px_16px_rgba(196,138,58,0.2)]'
          : 'border border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-800'}"
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
          ><path d="m7.5 4.27 9 5.15" /><path
            d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
          /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg
        >
        Stok Produk
      </button>
      <button
        onclick={() => {
          activeSubTab = "log";
          const url = new URL(window.location.href);
          url.searchParams.set("subtab", "log");
          window.history.pushState({}, "", url.href);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }}
        class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.85rem] font-bold whitespace-nowrap transition-all duration-300 active:scale-95 {activeSubTab ===
        'log'
          ? 'bg-[#c48a3a] text-white shadow-[0_4px_16px_rgba(196,138,58,0.2)]'
          : 'border border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-800'}"
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
          stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg
        >
        Log Mutasi
      </button>
    </div>
  </div>
  <div class="hidden lg:flex lg:items-center lg:gap-3">
    <div class="mr-2">
      <CatalogHeaderFilters
        tab="inventory"
        categoryOptions={categories}
        columns={activeSubTab === "stock" ? stockColumns : logColumns}
      />
    </div>

    {#if activeSubTab === "stock"}
      <ColumnVisibilityToggle bind:columns={stockColumns} />
    {:else}
      <ColumnVisibilityToggle bind:columns={logColumns} />
    {/if}

    <div class="h-10 w-px self-center bg-stone-200/80"></div>

    <Button
      variant="outline"
      href={`/api/admin/export?entity=${activeSubTab === "log" ? "inventory" : "products"}`}
      class="flex items-center justify-center border-stone-200 text-stone-600 hover:bg-stone-50"
    >
      <svg
        slot="children"
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="mr-1.5"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span class="font-bold">Ekspor</span>
    </Button>

    <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex items-center gap-2.5">
      <div
        class="flex h-5 w-5 items-center justify-center rounded-lg bg-white/20 transition-transform group-hover:rotate-90"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
        >
      </div>
      <span class="flex flex-col items-start leading-none">
        <span class="text-[0.6rem] font-bold tracking-wider text-white/70 uppercase">Update</span>
        <span class="text-[0.85rem] font-bold">Mutasi Stok</span>
      </span>
    </Button>
  </div>
</div>

<Fab onclick={() => (isDrawerOpen = true)} label="Mutasi Stok">
  {#snippet icon()}
    <div class="flex flex-col items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
      <span class="mt-0.5 text-[0.55rem] leading-none font-black">MUTASI</span>
    </div>
  {/snippet}
</Fab>

{#snippet inventoryIcon()}
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
    ><path
      d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
    /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg
  >
{/snippet}

{#snippet drawerFooter()}
  <div class="flex items-center gap-3">
    <button
      type="button"
      class="h-11 flex-1 rounded-2xl border border-stone-200 bg-white text-[0.7rem] font-black tracking-widest text-stone-400 uppercase transition-all hover:bg-stone-50 hover:text-stone-600 focus:outline-none active:scale-95 lg:h-[52px]"
      onclick={() => (isDrawerOpen = false)}
    >
      Batalkan
    </button>
    <Button
      type="submit"
      form="inventory-form"
      variant="primary"
      class="relative flex h-11 flex-[2] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#c48a3a] px-8 py-0 font-black text-white shadow-[0_10px_30px_-10px_rgba(196,138,58,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_35px_-10px_rgba(196,138,58,0.6)] active:scale-[0.98] lg:h-[52px]"
      disabled={isSubmitting}
    >
      {#if isSubmitting}
        <div class="flex items-center gap-3">
          <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span class="text-xs">Memproses...</span>
        </div>
      {:else}
        <div class="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
          >
          <span class="text-[0.75rem] tracking-tight uppercase">Proses Mutasi Stok</span>
        </div>
      {/if}
    </Button>
  </div>
{/snippet}

<Drawer
  bind:isOpen={isDrawerOpen}
  title="Mutasi Stok"
  subtitle="Input History Stok Aktual"
  icon={inventoryIcon}
  footer={drawerFooter}
  maxWidth="md"
>
  <div class="flex h-full flex-col px-5 py-6 lg:px-7 lg:py-8">
    <CrudInlineForm id="inventory-form" onsubmit={handleCreate} {isSubmitting} className="flex h-full flex-col">
      <div class="flex flex-1 flex-col space-y-6 lg:space-y-8">
        <div class="space-y-1.5">
          <SelectInput
            id={fieldIds.product}
            name="product_id"
            label="Produk Target"
            required
            placeholder="-- Pilih Produk dari Katalog --"
            options={currentProducts.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
            class="ring-stone-100/50"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <SelectInput
              id={fieldIds.type}
              name="type"
              label="Tipe Mutasi"
              placeholder="-- Pilih Tipe --"
              options={[
                { value: "in", label: "🟢 Masuk" },
                { value: "out", label: "🔴 Keluar" },
                { value: "adjustment", label: "🟤 Set" },
              ]}
              class="ring-stone-100/50"
            />
          </div>
          <div class="space-y-1.5">
            <TextInput
              id={fieldIds.qty}
              name="qty"
              type="number"
              label="Jumlah Qty"
              required
              placeholder="Cth: 24"
              min="1"
              class="text-center font-bold tabular-nums ring-stone-100/50"
            />
          </div>
        </div>

        <div class="flex flex-1 flex-col space-y-1.5">
          <Textarea
            id={fieldIds.notes}
            name="notes"
            label="Catatan / Alasan"
            placeholder="Tuliskan alasan mutasi atau sumber stok (misal: Restock via Supplier ABC)..."
            class="flex-1 ring-stone-100/50"
          />
        </div>
      </div>
    </CrudInlineForm>
  </div>
</Drawer>

{#if activeSubTab === "stock"}
  <div in:fly={{ y: 10, duration: 400 }}>
    <Table headers={activeStockHeaders}>
      {#if currentProducts.length === 0}
        <TableEmptyState title="Daftar Produk Kosong" colspan={activeStockHeaders.length}>
          {#snippet icon()}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
              /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg
            >
          {/snippet}
        </TableEmptyState>
      {/if}
      {#each currentProducts as product (product.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          {#if stockColumns[0].isVisible}
            <TableCell class="py-4 pl-3 text-[0.95rem] font-bold text-stone-900">{product.name}</TableCell>
          {/if}
          {#if stockColumns[1].isVisible}
            <TableCell class="py-4">
              <span
                class="rounded-md border border-stone-200/50 bg-stone-100/60 px-2 py-0.5 font-mono text-[0.7rem] text-stone-500 shadow-sm"
              >
                {product.sku || "N/A"}
              </span>
            </TableCell>
          {/if}
          {#if stockColumns[2].isVisible}
            <TableCell class="py-4">
              <InlineEditableField
                value={product.stock ?? 0}
                field="stock"
                ariaLabel="Edit Stok"
                class="w-full px-4 text-left font-bold text-stone-700 tabular-nums shadow-inner"
                onblur={(e: any) => handleUpdateStock(product.id, e.currentTarget.textContent || "0")}
                onkeydown={(e: any) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
              />
            </TableCell>
          {/if}
          {#if stockColumns[3].isVisible}
            <TableCell class="py-4 pr-6 font-bold text-stone-600 tabular-nums"
              ><span class="mr-1 text-[0.6rem] text-stone-400">Rp</span>
              {Number(product.price ?? 0).toLocaleString("id-ID")}</TableCell
            >
          {/if}
        </TableRow>
      {/each}
    </Table>
  </div>
{:else}
  <div in:fly={{ y: 10, duration: 400 }}>
    <Table headers={activeLogHeaders}>
      {#if currentMovements.length === 0}
        <TableEmptyState title="Riwayat Log Kosong" colspan={activeLogHeaders.length}>
          {#snippet icon()}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg
            >
          {/snippet}
        </TableEmptyState>
      {/if}
      {#each currentMovements as movement (movement.id)}
        <TableRow class="group border-b border-stone-100 text-sm transition-colors last:border-0 hover:bg-stone-50/50">
          {#if logColumns[0].isVisible}
            <TableCell class="py-4 font-bold text-stone-800">
              <div class="flex flex-col">
                <span>{movement.product_name || "-"}</span>
                {#if movement.notes}
                  <span class="text-[0.65rem] font-medium text-stone-400 lg:hidden">{movement.notes}</span>
                {/if}
              </div>
            </TableCell>
          {/if}
          {#if logColumns[1].isVisible}
            <TableCell class="py-4">
              <Badge
                variant={movement.type === "in" ? "success" : movement.type === "out" ? "danger" : "default"}
                showDot
              >
                {movement.type === "in" ? "Masuk (+)" : movement.type === "out" ? "Keluar (-)" : "Set (Adj)"}
              </Badge>
            </TableCell>
          {/if}
          {#if logColumns[2].isVisible}
            <TableCell
              class={`py-4 text-right text-[1rem] font-bold tabular-nums ${movement.type === "in" ? "text-emerald-600" : movement.type === "out" ? "text-rose-600" : "text-stone-700"}`}
            >
              {movement.type === "in" ? "+" : movement.type === "out" ? "-" : ""}{movement.qty}
            </TableCell>
          {/if}
          {#if logColumns[3].isVisible}
            <TableCell class="hidden py-4 font-mono text-[0.7rem] font-bold text-stone-500 lg:table-cell"
              >{movement.refOrderNo || "-"}</TableCell
            >
          {/if}
          {#if logColumns[4].isVisible}
            <TableCell class="hidden py-4 text-stone-500 lg:table-cell">{movement.notes || "-"}</TableCell>
          {/if}
          {#if logColumns[5].isVisible}
            <TableCell class="py-4 text-xs text-stone-400 tabular-nums"
              >{String(movement.createdAt).split("T")[0]}</TableCell
            >
          {/if}
        </TableRow>
      {/each}
    </Table>
  </div>
{/if}

<ToastNotification bind:this={toastRef} />
