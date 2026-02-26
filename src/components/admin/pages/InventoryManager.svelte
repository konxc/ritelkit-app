<script lang="ts">
  import SectionHeader from "../SectionHeader.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import AdminDataTable from "../AdminDataTable.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { trpc } from "../../../lib/trpc";
  import {
    createQuery,
    createMutation,
    useQueryClient,
  } from "@tanstack/svelte-query";

  let {
    products: initialProducts = [],
    movements: initialMovements = [],
  }: { products: any[]; movements: any[] } = $props();

  const queryClient = useQueryClient();
  let toastRef = $state<ToastNotification>();

  const productsQuery = createQuery({
    queryKey: ["inventory-products"],
    queryFn: () => trpc.inventory.listProducts.query(),
    initialData: () => initialProducts,
  });

  const movementsQuery = createQuery({
    queryKey: ["inventory-movements"],
    queryFn: () => trpc.inventory.listMovements.query(),
    initialData: () => initialMovements,
  });

  const createMovementMutation = createMutation({
    mutationFn: (data: any) => trpc.inventory.createMovement.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      toastRef?.show("Stok berhasil diperbarui!", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    createMovementMutation.mutate({
      productId: data.get("product_id") as string,
      type: data.get("type") as any,
      qty: Number(data.get("qty")),
      notes: (data.get("notes") as string) || undefined,
    });
    form.reset();
  };

  const currentProducts = $derived($productsQuery.data || initialProducts);
  const currentMovements = $derived($movementsQuery.data || initialMovements);

  const fieldIds = {
    product: "inventory-product",
    type: "inventory-type",
    qty: "inventory-qty",
    notes: "inventory-notes",
  };
</script>

<SectionHeader title="Tambah Mutasi Stok" badge="Restock & Penyesuaian" />

<CrudInlineForm
  id="inventory-form"
  on:submit={handleCreate}
  isSubmitting={createMovementMutation.isPending}
>
  <div
    class="flex flex-col md:flex-row gap-4 xl:gap-6 items-end pb-8 border-b border-stone-100 mb-8 w-full"
  >
    <div class="space-y-1.5 w-full md:flex-1">
      <label
        for={fieldIds.product}
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Produk</label
      >
      <select
        id={fieldIds.product}
        name="product_id"
        required
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none appearance-none cursor-pointer"
      >
        <option value="" disabled selected>Pilih Produk</option>
        {#each currentProducts as product}
          <option value={product.id}>{product.name}</option>
        {/each}
      </select>
    </div>
    <div class="space-y-1.5 w-full md:w-48 shrink-0">
      <label
        for={fieldIds.type}
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Tipe Mutasi</label
      >
      <select
        id={fieldIds.type}
        name="type"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none appearance-none cursor-pointer"
      >
        <option value="in">Stok Masuk (+)</option>
        <option value="out">Stok Keluar (-)</option>
        <option value="adjustment">Penyesuaian (Set)</option>
      </select>
    </div>
    <div class="space-y-1.5 w-full md:w-32 shrink-0">
      <label
        for={fieldIds.qty}
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Jumlah</label
      >
      <input
        id={fieldIds.qty}
        name="qty"
        type="number"
        required
        placeholder="0"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
      />
    </div>
    <div class="space-y-1.5 w-full md:flex-1">
      <label
        for={fieldIds.notes}
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Catatan / Alasan</label
      >
      <input
        id={fieldIds.notes}
        name="notes"
        placeholder="Cth: Restock Supplier"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
      />
    </div>
    <button
      class="flex items-center justify-center gap-2 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
      type="submit"
      disabled={createMovementMutation.isPending}
    >
      {#if createMovementMutation.isPending}
        <svg
          class="animate-spin -ml-1 mr-1 h-4 w-4 text-white inline-block"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          ><circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle><path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path></svg
        >
      {/if}
      Update Stok
    </button>
  </div>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Stok Produk" muted="Klik sel untuk edit" />
</div>
<AdminDataTable>
  <thead>
    <tr>
      <th>Produk</th>
      <th>SKU</th>
      <th>Stok</th>
      <th>Harga</th>
    </tr>
  </thead>
  <tbody>
    {#if currentProducts.length === 0}
      <tr>
        <td colspan="4" class="text-center py-12 text-stone-400 text-sm italic"
          >Belum ada produk terdaftar.</td
        >
      </tr>
    {/if}
    {#each currentProducts as product}
      <tr
        class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
      >
        <td class="py-4 font-bold text-stone-900">{product.name}</td>
        <td class="py-4 font-mono text-xs text-stone-500"
          >{product.sku || "-"}</td
        >
        <td class="py-4 tabular-nums font-bold text-stone-800 text-center"
          >{product.stock ?? 0}</td
        >
        <td class="py-4 tabular-nums font-bold text-stone-800 text-right pr-4"
          >Rp {Number(product.price ?? 0).toLocaleString("id-ID")}</td
        >
      </tr>
    {/each}
  </tbody>
</AdminDataTable>

<div class="mt-6">
  <SectionHeader title="Mutasi Terakhir" muted="30 entri terakhir" />
</div>
<AdminDataTable>
  <thead>
    <tr>
      <th>Produk</th>
      <th>Tipe</th>
      <th>Qty</th>
      <th>Order Ref</th>
      <th>Catatan</th>
      <th>Tanggal</th>
    </tr>
  </thead>
  <tbody>
    {#if currentMovements.length === 0}
      <tr>
        <td colspan="6" class="text-center py-12 text-stone-400 text-sm italic"
          >Belum ada riwayat mutasi.</td
        >
      </tr>
    {/if}
    {#each currentMovements as movement}
      <tr
        class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0 text-sm"
      >
        <td class="py-4 font-medium text-stone-900"
          >{movement.product_name || "-"}</td
        >
        <td class="py-4">
          <span
            class={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider ${
              movement.type === "in"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : movement.type === "out"
                  ? "bg-rose-50 text-rose-700 border border-rose-100"
                  : "bg-stone-100 text-stone-600 border border-stone-200"
            }`}
          >
            {movement.type === "in"
              ? "Masuk"
              : movement.type === "out"
                ? "Keluar"
                : "Adj"}
          </span>
        </td>
        <td
          class={`py-4 tabular-nums font-bold ${movement.type === "in" ? "text-emerald-600" : movement.type === "out" ? "text-rose-600" : "text-stone-700"}`}
        >
          {movement.type === "in"
            ? "+"
            : movement.type === "out"
              ? "-"
              : ""}{movement.qty}
        </td>
        <td class="py-4 font-mono text-xs text-[#c48a3a]"
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
