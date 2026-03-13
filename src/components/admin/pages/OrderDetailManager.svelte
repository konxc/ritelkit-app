<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { useQueryClient } from "@tanstack/svelte-query";
  import type { Order } from "../../../lib/types";
  import { createAdminMutation } from "../../../lib/admin-mutations.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import PanelCard from "../PanelCard.svelte";
  import Badge from "../ui/Badge.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import { onMount, untrack } from "svelte";
  import { fade, fly } from "svelte/transition";

  type OrderItem = { name: string; qty: number; price: number; total: number };
  type StatusHistory = { id: string; status: string; notes: string | null; createdAt: string };

  type OrderDetail = Order & {
    parsedItems?: OrderItem[];
    shippingAddress?: any;
    statusHistory?: StatusHistory[];
  };

  let props: { order: OrderDetail; lang?: any } = $props();
  initI18n(untrack(() => props.lang));

  let order = $state<OrderDetail>({ ...props.order });
  let toastRef = $state<ToastNotification>();
  const queryClient = useQueryClient();

  const updateMutation = createAdminMutation(
    (payload: { id: string; data: any }) => trpc.orders.update.mutate(payload),
    {
      invalidateKeys: [["orders.list"]],
      successMessage: t("orders.toast_update"),
      onSuccess: (_: any, vars: { id: string; data: any }) => {
        order = {
          ...order,
          ...vars.data,
        };
      },
    },
    () => toastRef,
  );

  const handleUpdateStatus = async (event: SubmitEvent) => {
    event.preventDefault();
    const data = {
      status: order.status,
      paymentStatus: order.paymentStatus,
      notes: order.notes,
    };

    await updateMutation.mutate({ id: order.id, data });
  };

  let isSubmitting = $derived(updateMutation.isPending);

  const statusColors: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
    completed: "success",
    shipped: "info",
    processing: "warning",
    pending: "warning",
    cancelled: "danger",
    delivered: "success",
  };

  const paymentColors: Record<string, "success" | "warning" | "danger" | "default"> = {
    paid: "success",
    unpaid: "danger",
    failed: "danger",
    refunded: "warning",
    expired: "default",
  };

  const handlePrint = () => {
    window.print();
  };
</script>

<div class="flex flex-col gap-8 pb-12 print:p-0">
  <!-- Header / Breadcrumb -->
  <div class="no-print flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div class="flex items-center gap-4">
      <a
        href="/admin/orders"
        class="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-400 transition-all hover:bg-stone-50 hover:text-stone-900 active:scale-95"
        title={t("common.back") || "Back"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
        >
      </a>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="font-mono text-2xl font-black tracking-tight text-stone-900 uppercase">{order.orderNo}</h1>
          <Badge variant={statusColors[order.status?.toLowerCase()] || "default"} showDot>
            {t(`orders.statuses.${order.status?.toLowerCase()}`) || order.status}
          </Badge>
        </div>
        <div class="mt-1 flex items-center gap-2 text-xs font-bold tracking-widest text-stone-400 uppercase">
          <span
            >{new Date(order.createdAt).toLocaleDateString(t("common.lang_code"), {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}</span
          >
          <span class="h-1 w-1 rounded-full bg-stone-300"></span>
          <span
            >{new Date(order.createdAt).toLocaleTimeString(t("common.lang_code"), {
              hour: "2-digit",
              minute: "2-digit",
            })}</span
          >
        </div>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <Button variant="outline" onclick={handlePrint} class="h-11 rounded-2xl px-6 font-bold text-stone-600">
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
          class="mr-2"
          ><path d="M6 9V2h12v7" /><path
            d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
          /><rect width="12" height="8" x="6" y="14" /></svg
        >
        {t("common.export") || "Print"}
      </Button>
      <Button
        variant="primary"
        href={`/admin/fulfillment?q=${order.orderNo}`}
        class="h-11 rounded-2xl px-6 font-black tracking-wide uppercase"
      >
        {t("orders.track_shipping")}
      </Button>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" in:fly={{ y: 20, duration: 400 }}>
    <PanelCard class="relative overflow-hidden border-stone-200/60 bg-white shadow-sm">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-50 text-stone-400">
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
            ><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg
          >
        </div>
        <div class="min-w-0">
          <p class="text-[0.65rem] font-bold tracking-widest text-stone-400 uppercase">{t("orders.detail_customer")}</p>
          {#if order.customerId}
            <a
              href={`/admin/customers/${order.customerId}`}
              class="block truncate text-sm font-black text-[#c48a3a] hover:underline"
            >
              {order.customerName}
            </a>
          {:else}
            <p class="truncate text-sm font-black text-stone-900">{order.customerName}</p>
          {/if}
        </div>
      </div>
      <div class="mt-3 flex flex-col gap-1 pl-13">
        <p class="font-mono text-[0.7rem] font-bold text-stone-500">{order.customerPhone}</p>
        <p class="truncate text-xs text-stone-400">{order.customerEmail || "-"}</p>
      </div>
    </PanelCard>

    <PanelCard class="relative overflow-hidden border-stone-200/60 bg-white shadow-sm">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-50 text-stone-400">
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
            ><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line
              x1="8"
              x2="8"
              y1="2"
              y2="6"
            /><line x1="3" x2="21" y1="10" y2="10" /></svg
          >
        </div>
        <div>
          <p class="text-[0.65rem] font-bold tracking-widest text-stone-400 uppercase">{t("orders.delivery_time")}</p>
          <p class="text-sm font-black text-[#c48a3a]">
            {order.shippingAddress?.delivery_date || "-"}
          </p>
        </div>
      </div>
      <div class="mt-3 pl-13">
        <Badge variant="default" class="py-0.5 text-[0.6rem]">
          {order.shippingAddress?.delivery_time || t("shipping.default_schedule")}
        </Badge>
      </div>
    </PanelCard>

    <PanelCard class="relative overflow-hidden border-stone-200/60 bg-white shadow-sm">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-50 text-stone-400">
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
            ><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path
              d="M6 12h.01M18 12h.01"
            /></svg
          >
        </div>
        <div>
          <p class="text-[0.65rem] font-bold tracking-widest text-stone-400 uppercase">{t("orders.payment_status")}</p>
          <Badge variant={paymentColors[order.paymentStatus?.toLowerCase()] || "default"} showDot class="mt-1">
            {t(`orders.payments.${order.paymentStatus?.toLowerCase()}`) || order.paymentStatus}
          </Badge>
        </div>
      </div>
    </PanelCard>

    <PanelCard class="relative overflow-hidden border-stone-900 bg-stone-900 text-white shadow-xl lg:-translate-y-1">
      <div class="absolute -top-4 -right-4 opacity-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path
            d="M12 18V6"
          /></svg
        >
      </div>
      <div class="flex flex-col gap-1">
        <p class="text-[0.65rem] font-black tracking-widest text-[#c48a3a] uppercase">{t("orders.total_bill")}</p>
        <div class="flex items-baseline gap-1">
          <span class="text-xs font-bold text-stone-500">{t("common.currency_symbol")}</span>
          <span class="font-mono text-2xl font-black tabular-nums">
            {Number(order.total).toLocaleString(t("common.lang_code"))}
          </span>
        </div>
      </div>
    </PanelCard>
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Item List -->
    <div class="flex flex-col gap-6 lg:col-span-2">
      <PanelCard class="overflow-hidden border-stone-200/60 bg-white p-0 shadow-sm">
        <div class="border-b border-stone-100 bg-stone-50/50 px-6 py-4">
          <h3 class="text-[0.75rem] font-black tracking-widest text-stone-500 uppercase">{t("orders.item_details")}</h3>
        </div>
        <div class="px-2 lg:px-4">
          <Table headers={[t("orders.product"), t("orders.qty"), t("orders.price"), t("orders.total")]}>
            {#each order.parsedItems || [] as item, i (item.name + i)}
              <TableRow class="group transition-colors hover:bg-stone-50/30">
                <TableCell class="py-5">
                  <span class="font-black text-stone-800">{item.name}</span>
                </TableCell>
                <TableCell class="py-5 text-center">
                  <span
                    class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 font-mono text-xs font-black text-stone-600"
                  >
                    {item.qty}
                  </span>
                </TableCell>
                <TableCell class="py-5 text-right font-mono text-sm text-stone-500 tabular-nums">
                  {t("common.currency_symbol")}
                  {Number(item.price).toLocaleString(t("common.lang_code"))}
                </TableCell>
                <TableCell
                  class="py-5 text-right font-mono text-[0.9rem] font-black text-[#c48a3a] text-stone-900 tabular-nums"
                >
                  {t("common.currency_symbol")}
                  {Number(item.total).toLocaleString(t("common.lang_code"))}
                </TableCell>
              </TableRow>
            {/each}
          </Table>
        </div>

        <div class="mt-4 space-y-4 bg-stone-50/50 p-6 lg:p-8">
          <div class="flex justify-between text-sm font-bold text-stone-500">
            <span class="tracking-wider uppercase">{t("orders.subtotal")}</span>
            <span class="font-mono tabular-nums"
              >{t("common.currency_symbol")} {Number(order.subtotal).toLocaleString(t("common.lang_code"))}</span
            >
          </div>
          {#if order.discountTotal > 0}
            <div class="flex justify-between text-sm font-bold text-rose-500">
              <span class="tracking-wider uppercase"
                >{t("orders.discount")} {order.couponCode ? `(${order.couponCode})` : ""}</span
              >
              <span class="font-mono tabular-nums"
                >- {t("common.currency_symbol")}
                {Number(order.discountTotal).toLocaleString(t("common.lang_code"))}</span
              >
            </div>
          {/if}
          <div class="flex justify-between text-sm font-bold text-stone-500">
            <span class="tracking-wider uppercase">{t("orders.shipping_fee")}</span>
            <span class="font-mono tabular-nums"
              >{t("common.currency_symbol")}
              {Number(order.deliveryFee || 0).toLocaleString(t("common.lang_code"))}</span
            >
          </div>
          <div class="flex justify-between border-t border-stone-200 pt-5">
            <span class="text-sm font-black tracking-widest text-stone-900 uppercase">{t("orders.total")}</span>
            <div class="flex items-baseline gap-1">
              <span class="text-xs font-bold text-stone-400">{t("common.currency_symbol")}</span>
              <span class="font-mono text-2xl font-black text-stone-900 tabular-nums">
                {Number(order.total).toLocaleString(t("common.lang_code"))}
              </span>
            </div>
          </div>
        </div>
      </PanelCard>

      <!-- History Timeline -->
      {#if order.statusHistory && order.statusHistory.length > 0}
        <PanelCard class="no-print overflow-hidden border-stone-200/60 bg-white p-0 shadow-sm">
          <div class="border-b border-stone-100 bg-stone-50/50 px-6 py-4">
            <h3 class="text-[0.75rem] font-black tracking-widest text-stone-500 uppercase">
              {t("orders.order_flow") || "Riwayat Status"}
            </h3>
          </div>
          <div class="p-6">
            <div
              class="relative flex flex-col gap-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-stone-100"
            >
              {#each order.statusHistory as history}
                <div class="relative flex gap-4">
                  <div
                    class="z-10 h-6 w-6 shrink-0 rounded-full border-4 border-white ring-2 ring-stone-100 {history.status ===
                    order.status
                      ? 'bg-[#c48a3a]'
                      : 'bg-stone-200'}"
                  ></div>
                  <div class="flex min-w-0 flex-col gap-1">
                    <div class="flex items-center gap-3">
                      <span class="text-sm font-black tracking-tighter text-stone-900 uppercase">
                        {t(`orders.statuses.${history.status?.toLowerCase()}`) || history.status}
                      </span>
                      <span class="text-[0.65rem] font-bold text-stone-400">
                        {new Date(history.createdAt).toLocaleString(t("common.lang_code"), {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {#if history.notes}
                      <p class="border-l-2 border-stone-100 pl-3 text-xs leading-relaxed text-stone-500 italic">
                        {history.notes}
                      </p>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </PanelCard>
      {/if}
    </div>

    <!-- Logistics & Admin Notes -->
    <div class="no-print flex flex-col gap-6">
      <PanelCard class="border-stone-200/60 bg-white shadow-sm">
        <div class="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 class="text-[0.7rem] font-black tracking-widest text-[#c48a3a] uppercase">{t("orders.shipping_info")}</h3>
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
            class="text-stone-300"
            ><path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5" /><circle
              cx="7"
              cy="17"
              r="2"
            /><circle cx="17" cy="17" r="2" /></svg
          >
        </div>
        <div class="space-y-5 text-sm">
          <div>
            <span class="text-[0.6rem] font-bold tracking-widest text-stone-400 uppercase">{t("orders.region")}</span>
            <p class="font-black text-stone-800">
              {order.shippingAddress?.district || "-"}, {order.shippingAddress?.city || "-"}
            </p>
            <p class="text-xs font-medium text-stone-500">{order.shippingAddress?.province || "-"}</p>
          </div>
          <div>
            <span class="text-[0.6rem] font-bold tracking-widest text-stone-400 uppercase"
              >{t("orders.full_address")}</span
            >
            <p class="mt-1.5 leading-relaxed font-medium text-stone-600">
              {order.shippingAddress?.street || t("shipping.address_not_available")}
            </p>
          </div>
          {#if order.shippingAddress?.notes}
            <div class="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
              <span class="text-[0.6rem] font-black tracking-wider text-amber-600 uppercase"
                >{t("orders.buyer_notes")}</span
              >
              <p class="mt-1 text-xs leading-relaxed font-semibold text-amber-900 italic">
                "{order.shippingAddress.notes}"
              </p>
            </div>
          {/if}
        </div>
      </PanelCard>

      <PanelCard class="border-stone-200/60 bg-white shadow-sm">
        <div class="mb-5 flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 class="text-[0.7rem] font-black tracking-widest text-stone-900 uppercase">{t("orders.admin_control")}</h3>
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
            class="text-stone-300"
            ><path
              d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
            /></svg
          >
        </div>
        <CrudInlineForm id="order-status-form" onsubmit={handleUpdateStatus} {isSubmitting}>
          <div class="flex flex-col gap-6">
            <SelectInput
              id="status"
              name="status"
              label={t("orders.order_flow")}
              placeholder={t("orders.select_status")}
              bind:value={order.status}
              class="bg-stone-50/50"
              options={[
                { value: "pending", label: t("orders.statuses.pending") },
                { value: "processing", label: t("orders.statuses.processing") },
                { value: "shipped", label: t("orders.statuses.shipped") },
                { value: "delivered", label: t("orders.statuses.delivered") },
                { value: "completed", label: t("orders.statuses.completed") },
                { value: "cancelled", label: t("orders.statuses.cancelled") },
              ]}
            />
            <SelectInput
              id="paymentStatus"
              name="paymentStatus"
              label={t("orders.payment_status")}
              placeholder={t("orders.select_payment")}
              bind:value={order.paymentStatus}
              class="bg-stone-50/50"
              options={[
                { value: "unpaid", label: t("orders.payments.unpaid") },
                { value: "paid", label: t("orders.payments.paid") },
                { value: "failed", label: t("orders.payments.failed") },
                { value: "refunded", label: t("orders.payments.refunded") },
              ]}
            />
            <TextInput
              id="notes"
              name="notes"
              label={t("orders.internal_memo")}
              placeholder="..."
              bind:value={order.notes}
              class="bg-stone-50/50 font-medium"
            />
            <Button
              type="submit"
              variant="primary"
              class="h-12 w-full font-black tracking-widest uppercase shadow-lg shadow-[#c48a3a]/20"
              disabled={isSubmitting}
            >
              {#if isSubmitting}
                <svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              {/if}
              {t("orders.save_changes")}
            </Button>

            <div class="mt-2 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                class="h-11 rounded-xl text-[0.65rem] font-bold tracking-wider uppercase"
                href="/admin/orders"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="mr-1.5"
                  ><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path
                    d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                  /></svg
                >
                {t("common.delete") || "Hapus"}
              </Button>
              <Button
                variant="outline"
                class="h-11 rounded-xl border-rose-100 text-[0.65rem] font-bold tracking-wider text-rose-500 uppercase hover:bg-rose-50"
                href="/admin/refunds"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="mr-1.5"
                  ><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg
                >
                {t("orders.refund")}
              </Button>
            </div>
          </div>
        </CrudInlineForm>
      </PanelCard>
    </div>
  </div>
</div>

<ToastNotification bind:this={toastRef} />

<style>
  @media print {
    .no-print {
      display: none !important;
    }
    :global(body) {
      background: white !important;
    }
    :global(.admin-main) {
      padding: 0 !important;
    }
    :global(.admin-topbar) {
      display: none !important;
    }
  }

  .pl-13 {
    padding-left: 3.25rem;
  }
</style>
