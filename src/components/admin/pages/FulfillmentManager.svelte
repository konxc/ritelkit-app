<script module lang="ts">
export type ShipmentRow = {
  id: string | number;
  orderNo: string;
  status: string;
  carrier?: string | null;
  trackingNo?: string | null;
  notes?: string | null;
};
</script>

<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { trpc } from "../../../lib/trpc";
  import { fade, fly } from "svelte/transition";
  import {
    createQuery,
    createMutation,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import { onMount } from "svelte";

  let { rows: initialShipments = [] }: { rows: ShipmentRow[] } = $props();

  const queryClient = useQueryClient();
  let toastRef: ToastNotification;

  // Query for existing shipments
  const shipmentsQuery = createQuery(() => ({
    queryKey: ["shipments"],
    queryFn: () => trpc.shipments.list.query({}),
    initialData: initialShipments.length > 0 ? initialShipments : undefined,
  }));

  // Query for orders that need fulfillment
  const ordersFulfillmentQuery = createQuery(() => ({
    queryKey: ["orders", "fulfillment"],
    queryFn: () => trpc.orders.fulfillment.query({}),
  }));

  const shipCreateMutation = createMutation(() => ({
    mutationFn: (data: any) => trpc.shipments.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toastRef?.show("Pengiriman berhasil dibuat!", "success");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Gagal membuat pengiriman";
      toastRef?.show(message, "error");
    },
  }));

  const shipUpdateMutation = createMutation(() => ({
    mutationFn: (payload: { id: string; data: any }) =>
      trpc.shipments.update.mutate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toastRef?.show("Pengiriman diperbarui", "success");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Gagal memperbarui pengiriman";
      toastRef?.show(message, "error");
    },
  }));

  const shipDeleteMutation = createMutation(() => ({
    mutationFn: (id: string) => trpc.shipments.delete.mutate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toastRef?.show("Pengiriman dihapus", "success");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Gagal menghapus pengiriman";
      toastRef?.show(message, "error");
    },
  }));

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    shipCreateMutation.mutate({
      orderNo: data.get("orderNo") as string,
      status: data.get("status") as string,
      carrier: data.get("carrier") as string,
      trackingNo: data.get("trackingNo") as string,
      notes: data.get("notes") as string,
    });
    form.reset();
  };

  const handleRowAction = (
    id: string | number,
    action: string,
    rowElement: HTMLElement | null,
  ) => {
    if (action === "delete") {
      if (confirm("Hapus pengiriman ini?")) {
        shipDeleteMutation.mutate(String(id));
      }
    } else if (action === "save" && rowElement) {
      const data: any = {};
      rowElement.querySelectorAll("[data-field]").forEach((el) => {
        if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
          data[el.getAttribute("data-field")!] = el.value;
        } else {
          data[el.getAttribute("data-field")!] = el.textContent?.trim();
        }
      });
      shipUpdateMutation.mutate({ id: String(id), data: data as any });
    }
  };

  let currentShipments = $derived((shipmentsQuery.data as ShipmentRow[]) || initialShipments);
  let pendingOrders = $derived(ordersFulfillmentQuery.data || []);
</script>
<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
<SectionHeader title="Buat Pengiriman" badge="Tracking" />
<CrudInlineForm
  id="shipment-form"
  on:submit={handleCreate}
  isSubmitting={shipCreateMutation.isPending}
>
  <div
    class="flex flex-col md:flex-row flex-wrap gap-4 xl:gap-6 items-end pb-8 border-b border-stone-100 mb-8 w-full"
  >
    <div class="space-y-1.5 w-full md:w-48 shrink-0">
      <label
        for="orderNo"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Order No</label
      >
      <input
        id="orderNo"
        name="orderNo"
        list="pending-orders"
        required
        placeholder="Cth: ORD-1001"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold"
      />
      <datalist id="pending-orders">
        {#each pendingOrders as order}
          <option value={order.orderNo}>{order.customerName}</option>
        {/each}
        {#if pendingOrders.length === 0}
          <option value="" disabled>Belum ada order untuk diproses</option>
        {/if}
      </datalist>
    </div>
    <div class="space-y-1.5 w-full md:w-32 shrink-0">
      <label
        for="status"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Status Awal</label
      >
      <select
        id="status"
        name="status"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm appearance-none cursor-pointer outline-none font-medium"
      >
        <option value="packing">📦 Packing</option>
        <option value="shipped">🚚 Dikirim</option>
        <option value="delivered">✅ Terkirim</option>
        <option value="cancelled">❌ Batal</option>
      </select>
    </div>
    <div class="space-y-1.5 w-full md:w-40 shrink-0">
      <label
        for="carrier"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Kurir / Ekspedisi</label
      >
      <input
        id="carrier"
        name="carrier"
        list="kurir-options"
        placeholder="Cth: JNE, J&T"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
      />
      <datalist id="kurir-options">
        <option value="JNE Express"></option>
        <option value="J&T Express"></option>
        <option value="SiCepat Ekspres"></option>
        <option value="Anteraja"></option>
        <option value="Pos Indonesia"></option>
        <option value="GoSend"></option>
        <option value="GrabExpress"></option>
        <option value="Paxel"></option>
      </datalist>
    </div>
    <div class="space-y-1.5 w-full md:flex-1 min-w-[150px]">
      <label
        for="trackingNo"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Nomor Resi</label
      >
      <input
        id="trackingNo"
        name="trackingNo"
        placeholder="Masukkan no resi..."
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-mono"
      />
    </div>
    <div class="space-y-1.5 w-full md:flex-1">
      <label
        for="notes"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Catatan Internal</label
      >
      <input
        id="notes"
        name="notes"
        placeholder="Opsional"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
      />
    </div>
    <button
      class="flex items-center justify-center gap-2 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
      type="submit"
      disabled={shipCreateMutation.isPending}
    >
      {#if shipCreateMutation.isPending}
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
      Buat Tracking
    </button>
  </div>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Pengiriman" />
</div>

<AdminDataTable>
  <thead>
    <tr>
      <th>Order</th>
      <th>Status</th>
      <th>Kurir</th>
      <th>Resi</th>
      <th>Catatan</th>
      <th>Aksi</th>
    </tr>
  </thead>
  <tbody>
    {#if currentShipments.length === 0}
      <tr>
        <td colspan="6" class="text-center py-12 text-stone-400 text-sm italic"
          >Belum ada pengiriman aktif.</td
        >
      </tr>
    {/if}
    {#each currentShipments as row (row.id)}
      <tr
        transition:fade={{ duration: 200 }}
        class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
      >
        <td
          contenteditable="true"
          data-field="orderNo"
          class="py-4 font-mono font-bold text-stone-900 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-3 py-1.5 rounded-lg border border-transparent transition-all"
          >{row.orderNo}</td
        >
        <td class="py-4">
          <select
            data-field="status"
            class="px-3 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-transparent text-sm cursor-pointer outline-none font-bold text-stone-700"
          >
            <option value="packing" selected={row.status === "packing"}
              >📦 Packing</option
            >
            <option value="shipped" selected={row.status === "shipped"}
              >🚚 Dikirim</option
            >
            <option value="delivered" selected={row.status === "delivered"}
              >✅ Terkirim</option
            >
            <option value="cancelled" selected={row.status === "cancelled"}
              >❌ Batal</option
            >
          </select>
        </td>
        <td
          contenteditable="true"
          data-field="carrier"
          class="py-4 font-medium text-stone-600 outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all"
          >{row.carrier || "-"}</td
        >
        <td
          contenteditable="true"
          data-field="trackingNo"
          class="py-4 font-mono text-sm text-[#c48a3a] font-bold outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all"
          >{row.trackingNo || "-"}</td
        >
        <td
          contenteditable="true"
          data-field="notes"
          class="py-4 text-stone-500 text-sm italic outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all"
          >{row.notes || "-"}</td
        >
        <td class="py-4 text-right pr-4">
          <RowActions
            isSaving={shipUpdateMutation.isPending &&
              (shipUpdateMutation.variables as any)?.id === row.id}
            isDeleting={shipDeleteMutation.isPending &&
              (shipDeleteMutation.variables as any) === row.id}
            onSave={(e) =>
              handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
            onDelete={() => handleRowAction(row.id, "delete", null)}
          />
        </td>
      </tr>
    {/each}
  </tbody>
</AdminDataTable>
</div>

<ToastNotification bind:this={toastRef} />
