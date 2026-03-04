<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { useQueryClient } from "@tanstack/svelte-query";
  import type { Order } from "../../../lib/types";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import PanelCard from "../PanelCard.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import Badge from "../ui/Badge.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";

  type OrderItem = { name: string; qty: number; price: number; total: number };
  type ShippingAddress = {
    province?: string;
    city?: string;
    district?: string;
    delivery_date?: string;
    delivery_time?: string;
  };
  type OrderDetail = Order & {
    parsedItems?: OrderItem[];
    shippingAddressJson?: ShippingAddress; // Consistent with Drizzle
  };

  let { order: initialOrder }: { order: OrderDetail } = $props();

  let order = $state<OrderDetail>({ ...initialOrder });

  $effect(() => {
    Object.assign(order, initialOrder);
  });

  let toastRef = $state<ToastNotification>();
  let isSubmitting = $state(false);

  const queryClient = useQueryClient();

  // Sync with initialOrder from SSR if it changes
  $effect(() => {
    order = initialOrder;
  });

  const handleUpdateStatus = async (event: SubmitEvent) => {
    event.preventDefault();
    // The form inputs are bound to `order.status`, `order.paymentStatus`, `order.notes`
    // so the `order` state is already updated.
    const data = {
      status: order.status,
      paymentStatus: order.paymentStatus,
      notes: order.notes,
    };

    isSubmitting = true;
    try {
      await trpc.orders.update.mutate({ id: order.id, data });
      toastRef?.show("Order updated", "success");
      queryClient.invalidateQueries({ queryKey: ["orders.list"] });
    } catch (error: any) {
      toastRef?.show(error.message, "error");
    } finally {
      isSubmitting = false;
    }
  };
</script>

<div>
  <Table headers={["Produk", "Qty", "Harga", "Total"]}>
    {#each order.parsedItems || [] as item, i (item.name + i)}
      <TableRow class="group transition-colors hover:bg-stone-50/30">
        <TableCell class="py-4 text-sm font-bold text-stone-900">{item.name}</TableCell>
        <TableCell class="py-4 text-center font-mono text-sm text-stone-600">{item.qty}</TableCell>
        <TableCell class="py-4 text-right text-sm text-stone-500 tabular-nums"
          >Rp {Number(item.price).toLocaleString("id-ID")}</TableCell
        >
        <TableCell class="py-4 text-right text-sm font-bold text-stone-800 tabular-nums"
          >Rp {Number(item.total).toLocaleString("id-ID")}</TableCell
        >
      </TableRow>
    {/each}
  </Table>
</div>

<SectionHeader title="Kelola Pesanan" muted="Perbarui status dan catatan internal" />
<CrudInlineForm id="order-status-form" data-order={order.orderNo} onsubmit={handleUpdateStatus} {isSubmitting}>
  <input type="hidden" name="order_id" value={order.id} />
  <div class="mb-8 flex w-full flex-col flex-wrap items-end gap-4 border-b border-stone-100 pb-8 md:flex-row xl:gap-6">
    <div class="w-full shrink-0 md:w-48">
      <SelectInput
        id="status"
        name="status"
        label="Status Order"
        bind:value={order.status}
        options={[
          { value: "pending", label: "Pending" },
          { value: "processing", label: "Processing" },
          { value: "shipped", label: "Shipped" },
          { value: "delivered", label: "Delivered" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ]}
      />
    </div>
    <div class="w-full shrink-0 md:w-48">
      <SelectInput
        id="paymentStatus"
        name="paymentStatus"
        label="Pembayaran"
        bind:value={order.paymentStatus}
        options={[
          { value: "unpaid", label: "Unpaid" },
          { value: "paid", label: "Paid" },
          { value: "failed", label: "Failed" },
          { value: "refunded", label: "Refunded" },
        ]}
      />
    </div>

    <div class="w-full md:flex-1">
      <TextInput
        id="notes"
        name="notes"
        label="Catatan Internal"
        placeholder="Tambahkan catatan untuk tim..."
        bind:value={order.notes}
      />
    </div>

    <Button type="submit" variant="primary" class="h-[42px] w-full px-8 md:w-auto" disabled={isSubmitting}>
      {#if isSubmitting}
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
      Simpan Perubahan
    </Button>
  </div>
</CrudInlineForm>

<ToastNotification bind:this={toastRef} />
