<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import SectionHeader from "../SectionHeader.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import PanelCard from "../PanelCard.svelte";
  import StatusBadge from "../StatusBadge.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { onMount } from "svelte";

  let { order = {} }: { order: any } = $props();

  const queryClient = useQueryClient();
  let csrfToken = "";
  let toastRef: ToastNotification;

  const updateMutation = createMutation({
    mutationFn: (payload: { id: string; data: any }) =>
      trpc.orders.update.mutate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toastRef?.show("Status order berhasil diperbarui!", "success");
      setTimeout(() => location.reload(), 800);
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  onMount(() => {
    csrfToken =
      document
        .querySelector("meta[name='csrf-token']")
        ?.getAttribute("content") || "";
  });

  const handleUpdateStatus = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const payload: any = {
      status: formData.get("status"),
      paymentStatus: formData.get("paymentStatus"),
      notes: formData.get("notes"),
    };
    updateMutation.mutate({ id: order.id, data: payload });
  };
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  <PanelCard className="flex flex-col h-full">
    <div class="flex items-center gap-3 mb-4">
      <div
        class="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600"
      >
        👤
      </div>
      <strong class="text-stone-900">Informasi Pelanggan</strong>
    </div>
    <div class="space-y-1">
      <p class="font-bold text-stone-900">{order.customer_name}</p>
      <p class="text-stone-500 font-mono text-sm">{order.customer_phone}</p>
      <p class="text-stone-400 text-sm italic">
        {order.customer_email || "Tanpa email"}
      </p>
    </div>
  </PanelCard>

  <PanelCard className="flex flex-col h-full">
    <div class="flex items-center gap-3 mb-4">
      <div
        class="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600"
      >
        📊
      </div>
      <strong class="text-stone-900">Status & Pembayaran</strong>
    </div>
    <div class="space-y-3">
      <div class="flex flex-wrap gap-2">
        <StatusBadge
          label={order.status.toUpperCase()}
          tone={order.status === "processing"
            ? "success"
            : order.status === "cancelled"
              ? "danger"
              : "default"}
        />
        <StatusBadge
          label={`PAYMENT: ${order.payment_status.toUpperCase()}`}
          tone={order.payment_status === "paid"
            ? "success"
            : order.payment_status === "failed"
              ? "danger"
              : "default"}
        />
      </div>
      <p class="text-xl font-bold text-[#c48a3a] tabular-nums">
        Rp {Number(order.total).toLocaleString("id-ID")}
      </p>
    </div>
  </PanelCard>

  <PanelCard className="flex flex-col h-full md:col-span-2 lg:col-span-1">
    <div class="flex items-center gap-3 mb-4">
      <div
        class="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600"
      >
        📍
      </div>
      <strong class="text-stone-900">Pengiriman</strong>
    </div>
    <div class="space-y-1 text-sm">
      <p class="font-bold text-stone-800">
        {order.shipping_address_json?.province ?? "-"} › {order
          .shipping_address_json?.city ?? "-"}
      </p>
      <p class="text-stone-600">
        {order.shipping_address_json?.district ?? ""}
      </p>
      <div class="pt-2 flex items-center gap-2 text-stone-500 font-medium">
        <span>📅 {order.shipping_address_json?.delivery_date || "-"}</span>
        <span class="text-stone-300">|</span>
        <span>🕒 {order.shipping_address_json?.delivery_time || "-"}</span>
      </div>
    </div>
  </PanelCard>
</div>

<div
  class="mb-10 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm"
>
  <div class="px-6 py-4 bg-stone-50 border-b border-stone-200">
    <strong class="text-stone-900 uppercase tracking-widest text-xs"
      >Rincian Item</strong
    >
  </div>
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
</div>

<SectionHeader
  title="Kelola Pesanan"
  muted="Perbarui status dan catatan internal"
/>
<CrudInlineForm
  id="order-status-form"
  data-order={order.order_no}
  on:submit={handleUpdateStatus}
  isSubmitting={$updateMutation.isPending}
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
        <option value="unpaid" selected={order.paymentStatus === "unpaid"}
          >Unpaid</option
        >
        <option value="paid" selected={order.paymentStatus === "paid"}
          >Paid</option
        >
        <option value="failed" selected={order.paymentStatus === "failed"}
          >Failed</option
        >
        <option value="refunded" selected={order.paymentStatus === "refunded"}
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
      disabled={$updateMutation.isPending}
    >
      {#if $updateMutation.isPending}
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
