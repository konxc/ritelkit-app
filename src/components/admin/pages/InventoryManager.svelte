<script lang="ts">
import { trpc } from "../../../lib/trpc";
import { fade, fly } from "svelte/transition";
import { createQuery, useQueryClient } from "@tanstack/svelte-query";
import AdminDataTable from "../AdminDataTable.svelte";
import CrudInlineForm from "../CrudInlineForm.svelte";
import SectionHeader from "../SectionHeader.svelte";
import ToastNotification from "../ToastNotification.svelte";

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

const productsQuery = createQuery(() => ({
	queryKey: ["inventory.products.list"],
	queryFn: () => trpc.inventory.listProducts.query(),
	initialData: initialProducts.length > 0 ? initialProducts : undefined,
	refetchOnMount: false,
	staleTime: 1000 * 60 * 5,
}));

const movementsQuery = createQuery(() => ({
	queryKey: ["inventory.movements.list"],
	queryFn: () => trpc.inventory.listMovements.query(),
	initialData: initialMovements.length > 0 ? initialMovements : undefined,
	refetchOnMount: false,
	staleTime: 1000 * 60 * 5,
}));

let currentProducts = $derived((productsQuery.data as InventoryProductRow[]) || initialProducts);
let currentMovements = $derived((movementsQuery.data as InventoryMovement[]) || initialMovements);

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

const fieldIds = {
	product: "inventory-product",
	type: "inventory-type",
	qty: "inventory-qty",
	notes: "inventory-notes",
};
</script>
<div class="flex items-center justify-between mt-2 mb-8">
  <SectionHeader title="Stok Produk Aktual" muted="Klik nominal stok untuk edit" />
  <button
    class="flex items-center gap-2 px-4 py-2 bg-stone-900 border border-transparent rounded-xl text-white text-[0.85rem] font-bold shadow-sm hover:bg-stone-800 transition-all hover:shadow-md"
    onclick={() => isDrawerOpen = true}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
    Mutasi Stok
  </button>
</div>

{#if isDrawerOpen}
<div class="fixed inset-0 z-[100] flex justify-end">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
    transition:fade={{duration: 200}} 
    onclick={() => isDrawerOpen = false}
  ></div>
  
  <div class="relative w-full max-w-md bg-white border-l border-stone-100 h-full shadow-2xl flex flex-col z-[101]" transition:fly={{x: 400, opacity: 1, duration: 300}}>
    <div class="flex items-center justify-between px-6 py-5 border-b border-stone-100 bg-stone-50/50">
      <div>
        <h3 class="font-bold text-stone-800 text-lg">Tambah Mutasi Stok</h3>
        <p class="text-xs font-semibold text-stone-400 mt-0.5 uppercase tracking-wider">Restock & Penyesuaian</p>
      </div>
      <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 text-stone-500 transition-colors" onclick={() => isDrawerOpen = false}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto w-full">
      <CrudInlineForm
        id="inventory-form"
        onsubmit={handleCreate}
        isSubmitting={isSubmitting}
      >
        <div class="p-6 space-y-6">
          <div class="space-y-1.5">
            <label
              for={fieldIds.product}
              class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
              >Produk Target</label
            >
            <select
              id={fieldIds.product}
              name="product_id"
              required
              class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none shadow-sm appearance-none cursor-pointer font-medium"
            >
              <option value="" disabled selected>Pilih Produk...</option>
              {#each currentProducts as product}
                <option value={product.id}>{product.name}</option>
              {/each}
            </select>
          </div>
          <div class="space-y-1.5">
            <label
              for={fieldIds.type}
              class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
              >Tipe Mutasi</label
            >
            <select
              id={fieldIds.type}
              name="type"
              class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none shadow-sm appearance-none cursor-pointer font-medium"
            >
              <option value="in">🟢 Masuk (+)</option>
              <option value="out">🔴 Keluar (-)</option>
              <option value="adjustment">🟤 Set (Adj)</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label
              for={fieldIds.qty}
              class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
              >Jumlah Qty Mutasi</label
            >
            <input
              id={fieldIds.qty}
              name="qty"
              type="number"
              required
              placeholder="0"
              min="1"
              class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none shadow-sm font-bold tabular-nums text-center"
            />
          </div>
          <div class="space-y-1.5">
            <label
              for={fieldIds.notes}
              class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
              >Catatan / Alasan</label
            >
            <textarea
              id={fieldIds.notes}
              name="notes"
              rows="3"
              placeholder="Cth: Restock dari Supplier A"
              class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-stone-50 focus:bg-white text-sm outline-none shadow-sm resize-none"
            ></textarea>
          </div>
        </div>
        
        <div class="p-6 pt-2 border-t border-stone-100 bg-stone-50/30 mt-auto">
          <button
            class="flex items-center justify-center gap-2 h-[46px] px-10 rounded-xl bg-gradient-to-r from-[#c48a3a] to-[#a6722d] text-white text-sm font-bold hover:shadow-[0_4px_12px_rgba(196,138,58,0.25)] hover:-translate-y-0.5 transition-all shadow-md w-full disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <svg class="animate-spin h-4 w-4 mr-1 inline" viewBox="0 0 24 24"
                ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            {/if}
            Proses Mutasi Stok
          </button>
        </div>
      </CrudInlineForm>
    </div>
  </div>
</div>
{/if}
<AdminDataTable>
  <thead>
    <tr>
      <th>Produk ID</th>
      <th>SKU Code</th>
      <th class="text-right">Ketersediaan Stok</th>
      <th class="text-right">Harga Aktual</th>
    </tr>
  </thead>
  <tbody>
    {#if currentProducts.length === 0}
      <tr>
        <td colspan="4" class="py-12">
          <div class="flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mb-3 border border-stone-100">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
            </div>
            <p class="text-sm font-bold text-stone-900 mb-1">Daftar Produk Kosong</p>
          </div>
        </td>
      </tr>
    {/if}
    {#each currentProducts as product (product.id)}
      <tr
        transition:fade={{ duration: 200 }}
        class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
      >
        <td class="py-4 font-bold text-stone-900 text-[0.95rem] pl-3">{product.name}</td>
        <td class="py-4">
           <span class="font-mono text-[0.7rem] text-stone-500 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-md shadow-sm">
             {product.sku || "N/A"}
           </span>
        </td>
        <td class="py-4 text-right">
             <div
               class="tabular-nums font-bold text-stone-700 bg-stone-50 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-4 py-1.5 rounded-lg border border-stone-100 transition-all w-24 text-right ml-auto shadow-inner inline-block"
             >
               {product.stock ?? 0}
             </div>
        </td>
        <td class="py-4 tabular-nums font-bold text-stone-600 text-right pr-6"
          ><span class="text-[0.6rem] text-stone-400 mr-1">Rp</span> {Number(product.price ?? 0).toLocaleString("id-ID")}</td
        >
      </tr>
    {/each}
  </tbody>
</AdminDataTable>

<div class="mt-12 mb-4">
  <SectionHeader title="Log Mutasi Terakhir" badge="Otomatis" muted="30 riwayat stok terbaru" />
</div>
<AdminDataTable>
  <thead>
    <tr>
      <th>Produk</th>
      <th>Aktivitas</th>
      <th class="text-right">Mutasi Qty</th>
      <th>Order Ref</th>
      <th>Catatan Admin</th>
      <th class="text-right">Tanggal Log</th>
    </tr>
  </thead>
  <tbody>
    {#if currentMovements.length === 0}
      <tr>
        <td colspan="6" class="py-12">
          <div class="flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mb-3 border border-stone-100">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <p class="text-sm font-bold text-stone-900 mb-1">Riwayat Log Kosong</p>
          </div>
        </td>
      </tr>
    {/if}
    {#each currentMovements as movement (movement.id)}
      <tr
        transition:fade={{ duration: 200 }}
        class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0 text-sm"
      >
        <td class="py-4 font-bold text-stone-800"
          >{movement.productName || "-"}</td
        >
        <td class="py-4">
          <span
            class={`px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider shadow-sm ${
              movement.type === "in"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : movement.type === "out"
                  ? "bg-rose-50 text-rose-700 border border-rose-100"
                  : "bg-stone-50 text-stone-600 border border-stone-200"
            }`}
          >
            {movement.type === "in"
              ? "🟢 Masuk (+)"
              : movement.type === "out"
                ? "🔴 Keluar (-)"
                : "🟤 Set (Adj)"}
          </span>
        </td>
        <td
          class={`py-4 tabular-nums font-bold text-right text-[1rem] ${movement.type === "in" ? "text-emerald-600" : movement.type === "out" ? "text-rose-600" : "text-stone-700"}`}
        >
          {movement.type === "in"
            ? "+"
            : movement.type === "out"
              ? "-"
              : ""}{movement.qty}
        </td>
        <td class="py-4 font-mono text-[0.7rem] font-bold text-stone-500"
          >{movement.refOrderNo || "-"}</td
        >
        <td class="py-4 text-stone-500">{movement.notes || "-"}</td>
        <td class="py-4 tabular-nums text-stone-400 text-xs"
          >{String(movement.createdAt).split("T")[0]}</td
        >
      </tr>
    {/each}
  </tbody>
</AdminDataTable>

<ToastNotification bind:this={toastRef} />
