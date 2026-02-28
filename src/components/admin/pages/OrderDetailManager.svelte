<script lang="ts">
import { trpc } from "../../../lib/trpc";
import { useQueryClient } from "@tanstack/svelte-query";
import type { Order } from "../../../lib/types";
import CrudInlineForm from "../CrudInlineForm.svelte";
import PanelCard from "../PanelCard.svelte";
import SectionHeader from "../SectionHeader.svelte";
import StatusBadge from "../StatusBadge.svelte";
import ToastNotification from "../ToastNotification.svelte";

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
	shipping_address_json?: ShippingAddress;
	customerName: string;
	customerPhone: string;
	customerEmail?: string | null;
};

let { order: initialOrder = {} as OrderDetail }: { order?: OrderDetail } =
	$props();

let order = $state<OrderDetail>({} as OrderDetail);
$effect(() => {
	order = initialOrder;
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

  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-stone-50/50">
          <th
            class="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest"
            >Produk</th
          >
          <th
            class="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center"
            >Qty</th
          >
          <th
            class="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right"
            >Harga</th
          >
          <th
            class="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right"
            >Total</th
          >
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-100">
        {#each order.parsedItems || [] as item (item.name)}
          <tr class="group hover:bg-stone-50/30 transition-colors">
            <td class="px-6 py-4 text-sm font-bold text-stone-900"
              >{item.name}</td
            >
            <td class="px-6 py-4 text-sm text-stone-600 font-mono text-center"
              >{item.qty}</td
            >
            <td class="px-6 py-4 text-sm text-stone-500 tabular-nums text-right"
              >Rp {Number(item.price).toLocaleString("id-ID")}</td
            >
            <td
              class="px-6 py-4 text-sm font-bold text-stone-800 tabular-nums text-right"
              >Rp {Number(item.total).toLocaleString("id-ID")}</td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

<SectionHeader
  title="Kelola Pesanan"
  muted="Perbarui status dan catatan internal"
/>
<CrudInlineForm
  id="order-status-form"
  data-order={order.orderNo}
  onsubmit={handleUpdateStatus}
  isSubmitting={isSubmitting}
>
  <input type="hidden" name="order_id" value={order.id} />
  <div
    class="flex flex-col md:flex-row flex-wrap gap-4 xl:gap-6 items-end pb-8 mb-8 w-full border-b border-stone-100"
  >
    <div class="space-y-1.5 w-full md:w-48 shrink-0">
      <label
        for="status"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Status Order</label
      >
      <select
        id="status"
        name="status"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none appearance-none cursor-pointer font-bold"
      >
        <option value="pending" selected={order.status === "pending"}
          >Pending</option
        >
        <option value="processing" selected={order.status === "processing"}
          >Processing</option
        >
        <option value="completed" selected={order.status === "completed"}
          >Completed</option
        >
        <option value="cancelled" selected={order.status === "cancelled"}
          >Cancelled</option
        >
      </select>
    </div>
    <div class="space-y-1.5 w-full md:w-48 shrink-0">
      <label
        for="paymentStatus"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Pembayaran</label
      >
      <select
        id="paymentStatus"
        name="paymentStatus"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none appearance-none cursor-pointer font-bold"
      >
        <option value="unpaid" selected={order.paymentStatus === "unpaid"}>
          >Unpaid</option
        >
        <option value="paid" selected={order.paymentStatus === "paid"}>
          >Paid</option
        >
        <option value="failed" selected={order.paymentStatus === "failed"}>
          >Failed</option
        >
        <option value="refunded" selected={order.paymentStatus === "refunded"}>
          >Refunded</option
        >
      </select>
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
        placeholder="Tambahkan catatan untuk tim..."
        value={order.notes || ""}
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
      />
    </div>
    <button
      class="flex items-center justify-center gap-3 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
      type="submit"
      disabled={isSubmitting}
    >
      {#if isSubmitting}
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
      Simpan Perubahan
    </button>
  </div>
</CrudInlineForm>

<ToastNotification bind:this={toastRef} />
