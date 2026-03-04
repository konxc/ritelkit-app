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
import Button from "../ui/Button.svelte";
import TextInput from "../ui/forms/TextInput.svelte";
import SelectInput from "../ui/forms/SelectInput.svelte";
import Textarea from "../ui/forms/Textarea.svelte";
import { fly } from "svelte/transition";
import Fab from "../ui/Fab.svelte";
import Badge from "../ui/Badge.svelte";
import Drawer from "../ui/overlay/Drawer.svelte";

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
  movements: initialMovements = [],
}: {
  products?: InventoryProductRow[];
  movements?: InventoryMovement[];
} = $props();

const queryClient = useQueryClient();
let toastRef = $state<ToastNotification>();
let isSubmitting = $state(false);
let isDrawerOpen = $state(false);
let activeSubTab = $state("stok");

// Reactive filters from URL
let q = $state("");

function syncFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  q = params.get("q") || "";
}

onMount(() => {
  const params = new URLSearchParams(window.location.search);
  const sub = params.get("subtab");
  if (sub === "stok" || sub === "log") {
    activeSubTab = sub;
  }
  syncFiltersFromUrl();
  window.addEventListener("popstate", syncFiltersFromUrl);
  return () => window.removeEventListener("popstate", syncFiltersFromUrl);
});

const productsQuery = createQuery(() => ({
  queryKey: ["inventory.products.list", { q }],
  queryFn: () => trpc.inventory.listProducts.query({ q }),
  initialData: q === "" ? initialProducts : undefined,
  placeholderData: (prev) => prev,
}));

const movementsQuery = createQuery(() => ({
  queryKey: ["inventory.movements.list"],
  queryFn: () => trpc.inventory.listMovements.query(),
  initialData: initialMovements.length > 0 ? initialMovements : undefined,
  refetchOnMount: false,
  staleTime: 1000 * 60 * 5,
}));

let currentProducts = $derived((productsQuery.data as InventoryProductRow[]) || []);
let currentMovements = $derived((movementsQuery.data as InventoryMovement[]) || []);

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
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    toastRef?.show(message, "error");
  } finally {
    isSubmitting = false;
  }
};

const handleUpdateStock = async (id: string, newStockRaw: string) => {
  const qty = Number(newStockRaw.trim());
  if (Number.isNaN(qty)) {
    toastRef?.show("Stok harus angka", "error");
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
    toastRef?.show("Gagal update stok", "error");
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
      title={activeSubTab === "stok" ? "Stok Produk Aktual" : "Log Mutasi Terakhir"}
      muted={activeSubTab === "stok"
        ? "Klik nominal stok untuk edit & Enter/Blur untuk simpan"
        : "30 riwayat stok terbaru"}
    />

    <!-- Sub-Tabs Navigation -->
    <div class="no-scrollbar mt-4 flex items-center gap-2 overflow-x-auto pb-1">
      <button
        onclick={() => (activeSubTab = "stok")}
        class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.85rem] font-bold whitespace-nowrap transition-all duration-300 active:scale-95 {activeSubTab ===
        'stok'
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
        onclick={() => (activeSubTab = "log")}
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
  <div class="hidden lg:block">
    <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex h-auto items-center gap-2.5 py-3">
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

{#if activeSubTab === "stok"}
  <div in:fly={{ y: 10, duration: 400 }}>
    <Table headers={["Produk", "SKU Code", "Ketersediaan Stok", "Harga Aktual"]}>
      {#if currentProducts.length === 0}
        <TableRow>
          <TableCell colspan={4} class="py-12">
            <div class="flex flex-col items-center justify-center text-center">
              <div
                class="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-stone-100 bg-stone-50 text-stone-300"
              >
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
              </div>
              <p class="mb-1 text-sm font-bold text-stone-900">Daftar Produk Kosong</p>
            </div>
          </TableCell>
        </TableRow>
      {/if}
      {#each currentProducts as product (product.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          <TableCell class="py-4 pl-3 text-[0.95rem] font-bold text-stone-900">{product.name}</TableCell>
          <TableCell class="py-4">
            <span
              class="rounded-md border border-stone-200/50 bg-stone-100/60 px-2 py-0.5 font-mono text-[0.7rem] text-stone-500 shadow-sm"
            >
              {product.sku || "N/A"}
            </span>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              role="textbox"
              tabindex="0"
              aria-label="Edit Stok"
              data-field="stock"
              onblur={(e) => handleUpdateStock(product.id, e.currentTarget.textContent || "0")}
              onkeydown={(e) => e.key === "Enter" && (e.preventDefault(), (e.currentTarget as any).blur())}
              class="w-full rounded-lg border border-stone-200/50 bg-stone-100/60 px-4 py-1.5 text-left font-bold text-stone-700 tabular-nums shadow-inner transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
            >
              {product.stock ?? 0}
            </div>
          </TableCell>
          <TableCell class="py-4 pr-6 font-bold text-stone-600 tabular-nums"
            ><span class="mr-1 text-[0.6rem] text-stone-400">Rp</span>
            {Number(product.price ?? 0).toLocaleString("id-ID")}</TableCell
          >
        </TableRow>
      {/each}
    </Table>
  </div>
{:else}
  <div in:fly={{ y: 10, duration: 400 }}>
    <Table
      headers={[
        "Produk",
        "Aktivitas",
        "Qty",
        { label: "Ref", class: "hidden lg:table-cell" },
        { label: "Catatan", class: "hidden lg:table-cell" },
        "Waktu",
      ]}
    >
      {#if currentMovements.length === 0}
        <TableRow>
          <TableCell colspan={6} class="py-12">
            <div class="flex flex-col items-center justify-center text-center">
              <div
                class="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-stone-100 bg-stone-50 text-stone-300"
              >
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
              </div>
              <p class="mb-1 text-sm font-bold text-stone-900">Riwayat Log Kosong</p>
            </div>
          </TableCell>
        </TableRow>
      {/if}
      {#each currentMovements as movement (movement.id)}
        <TableRow class="group border-b border-stone-100 text-sm transition-colors last:border-0 hover:bg-stone-50/50">
          <TableCell class="py-4 font-bold text-stone-800">
            <div class="flex flex-col">
              <span>{movement.product_name || "-"}</span>
              {#if movement.notes}
                <span class="text-[0.65rem] font-medium text-stone-400 lg:hidden">{movement.notes}</span>
              {/if}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <Badge
              variant={movement.type === "in" ? "success" : movement.type === "out" ? "danger" : "default"}
              showDot
            >
              {movement.type === "in" ? "Masuk (+)" : movement.type === "out" ? "Keluar (-)" : "Set (Adj)"}
            </Badge>
          </TableCell>
          <TableCell
            class={`py-4 text-right text-[1rem] font-bold tabular-nums ${movement.type === "in" ? "text-emerald-600" : movement.type === "out" ? "text-rose-600" : "text-stone-700"}`}
          >
            {movement.type === "in" ? "+" : movement.type === "out" ? "-" : ""}{movement.qty}
          </TableCell>
          <TableCell class="hidden py-4 font-mono text-[0.7rem] font-bold text-stone-500 lg:table-cell"
            >{movement.refOrderNo || "-"}</TableCell
          >
          <TableCell class="hidden py-4 text-stone-500 lg:table-cell">{movement.notes || "-"}</TableCell>
          <TableCell class="py-4 text-xs text-stone-400 tabular-nums"
            >{String(movement.createdAt).split("T")[0]}</TableCell
          >
        </TableRow>
      {/each}
    </Table>
  </div>
{/if}

<ToastNotification bind:this={toastRef} />
