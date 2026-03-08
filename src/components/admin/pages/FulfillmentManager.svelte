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
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import { trpc } from "../../../lib/trpc";
  import { fade, fly } from "svelte/transition";
  import { createQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
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
    mutationFn: (payload: { id: string; data: any }) => trpc.shipments.update.mutate(payload),
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

  const handleRowAction = (id: string | number, action: string, rowElement: HTMLElement | null) => {
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

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <SectionHeader title="Buat Pengiriman" badge="Tracking" />
    <CrudInlineForm id="shipment-form" on:submit={handleCreate} isSubmitting={shipCreateMutation.isPending}>
      <div
        class="mb-8 flex w-full flex-col flex-wrap items-end gap-4 border-b border-stone-100 pb-8 md:flex-row xl:gap-6"
      >
        <div class="relative w-full shrink-0 md:w-48">
          <TextInput
            id="orderNo"
            name="orderNo"
            label="Order No"
            required
            placeholder="Cth: ORD-1001"
            list="pending-orders"
            class="w-full font-bold"
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
        <div class="w-full shrink-0 md:w-32">
          <SelectInput
            id="status"
            name="status"
            label="Status Awal"
            options={[
              { value: "packing", label: "📦 Packing" },
              { value: "shipped", label: "🚚 Dikirim" },
              { value: "delivered", label: "✅ Terkirim" },
              { value: "cancelled", label: "❌ Batal" },
            ]}
          />
        </div>
        <div class="relative w-full shrink-0 md:w-40">
          <TextInput
            id="carrier"
            name="carrier"
            label="Kurir / Ekspedisi"
            list="kurir-options"
            placeholder="Cth: JNE, J&T"
            class="w-full"
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
        <div class="w-full min-w-[150px] md:flex-1">
          <TextInput
            id="trackingNo"
            name="trackingNo"
            label="Nomor Resi"
            placeholder="Masukkan no resi..."
            class="w-full font-mono"
          />
        </div>
        <div class="w-full md:flex-1">
          <TextInput id="notes" name="notes" label="Catatan Internal" placeholder="Opsional" class="w-full" />
        </div>
        <Button
          type="submit"
          variant="primary"
          class="h-[42px] w-full px-8 md:w-auto"
          disabled={shipCreateMutation.isPending}
        >
          {#if shipCreateMutation.isPending}
            <svg
              class="mr-1 -ml-1 inline-block h-4 w-4 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path></svg
            >
          {/if}
          Buat Tracking
        </Button>
      </div>
    </CrudInlineForm>

    <div class="mt-6">
      <SectionHeader title="Daftar Pengiriman" />
    </div>

    <Table headers={["Order", "Status", "Kurir", "Resi", "Catatan", "Aksi"]}>
      {#if currentShipments.length === 0}
        <TableRow>
          <TableCell colspan={6} class="py-12 text-center text-sm text-stone-400 italic"
            >Belum ada pengiriman aktif.</TableCell
          >
        </TableRow>
      {/if}
      {#each currentShipments as row (row.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          <TableCell
            class="rounded-lg border border-transparent px-3 py-1.5 py-4 font-mono font-bold text-stone-900 transition-all"
          >
            <div
              contenteditable="true"
              data-field="orderNo"
              class="rounded-lg border border-transparent px-3 py-1.5 transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
            >
              {row.orderNo}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <select
              data-field="status"
              class="cursor-pointer rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-sm font-bold text-stone-700 transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
            >
              <option value="packing" selected={row.status === "packing"}>📦 Packing</option>
              <option value="shipped" selected={row.status === "shipped"}>🚚 Dikirim</option>
              <option value="delivered" selected={row.status === "delivered"}>✅ Terkirim</option>
              <option value="cancelled" selected={row.status === "cancelled"}>❌ Batal</option>
            </select>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="carrier"
              class="rounded-lg px-3 py-1.5 font-medium text-stone-600 transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.carrier || "-"}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="trackingNo"
              class="rounded-lg px-3 py-1.5 font-mono text-sm font-bold text-[#c48a3a] transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.trackingNo || "-"}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="notes"
              class="rounded-lg px-3 py-1.5 text-sm text-stone-500 italic transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.notes || "-"}
            </div>
          </TableCell>
          <TableCell class="py-4 pr-4 text-right">
            <RowActions
              isSaving={shipUpdateMutation.isPending && (shipUpdateMutation.variables as any)?.id === row.id}
              isDeleting={shipDeleteMutation.isPending && (shipDeleteMutation.variables as any) === row.id}
              onSave={(e) => handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
              onDelete={() => handleRowAction(row.id, "delete", null)}
            />
          </TableCell>
        </TableRow>
      {/each}
    </Table>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
