<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { useQueryClient } from "@tanstack/svelte-query";
  import type { Order } from "../../../lib/types";
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
  import { onMount } from "svelte";

  type OrderItem = { name: string; qty: number; price: number; total: number };

  type OrderDetail = Order & {
    parsedItems?: OrderItem[];
    shippingAddress?: any;
  };

  let props: { order: OrderDetail } = $props();
  // svelte-ignore state_referenced_locally
  let order = $state<OrderDetail>({ ...props.order });

  let toastRef = $state<ToastNotification>();
  let isSubmitting = $state(false);

  const queryClient = useQueryClient();

  $effect(() => {
    order = { ...props.order };
  });

  const handleUpdateStatus = async (event: SubmitEvent) => {
    event.preventDefault();
    const data = {
      status: order.status,
      paymentStatus: order.paymentStatus,
      notes: order.notes,
    };

    isSubmitting = true;
    try {
      await trpc.orders.update.mutate({ id: order.id, data });
      toastRef?.show(t("orders.toast_update"), "success");
      queryClient.invalidateQueries({ queryKey: ["orders.list"] });
    } finally {
      isSubmitting = false;
    }
  };
</script>

<div class="flex flex-col gap-6 lg:gap-8">
  <!-- Status Dashboard -->
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    <PanelCard title={t("orders.detail_customer")} class="bg-stone-50/30">
      <div class="space-y-1">
        <p class="text-sm font-bold text-stone-900">{order.customerName}</p>
        <p class="font-mono text-xs text-stone-500">{order.customerPhone}</p>
        <p class="text-xs text-stone-500">{order.customerEmail || "-"}</p>
      </div>
    </PanelCard>

    <PanelCard title={t("orders.delivery_time")} class="bg-stone-50/30">
      <div class="space-y-1">
        <p class="text-sm font-bold text-[#c48a3a]">
          {order.shippingAddress?.delivery_date || "-"}
        </p>
        <p class="text-[0.65rem] font-bold tracking-wider text-stone-400 uppercase">
          {order.shippingAddress?.delivery_time || t("shipping.default_schedule")}
        </p>
      </div>
    </PanelCard>

    <PanelCard title={t("orders.order_status")} class="bg-stone-50/30">
      <div class="flex flex-wrap gap-2">
        <Badge variant={order.status === "completed" ? "success" : order.status === "cancelled" ? "danger" : "warning"}>
          {t("status." + order.status) || order.status}
        </Badge>
        <Badge variant={order.paymentStatus === "paid" ? "success" : "danger"}>
          {t("payment." + order.paymentStatus) || order.paymentStatus}
        </Badge>
      </div>
    </PanelCard>

    <PanelCard title={t("orders.cost_summary")} class="bg-stone-900 !text-white">
      <div class="space-y-0.5">
        <p class="text-[0.65rem] font-bold tracking-widest text-stone-400 uppercase">{t("orders.total_bill")}</p>
        <p class="font-mono text-xl font-black text-white">
          <span class="mr-1 text-xs font-bold text-stone-500">{t("common.currency_symbol")}</span>{Number(
            order.total,
          ).toLocaleString(t("common.lang_code"))}
        </p>
      </div>
    </PanelCard>
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Item List -->
    <div class="lg:col-span-2">
      <PanelCard title={t("orders.item_details")} class="h-full">
        <Table headers={[t("orders.product"), t("orders.qty"), t("orders.price"), t("orders.total")]}>
          {#each order.parsedItems || [] as item, i (item.name + i)}
            <TableRow class="group transition-colors hover:bg-stone-50/30">
              <TableCell class="py-4 text-sm font-bold text-stone-900">{item.name}</TableCell>
              <TableCell class="py-4 text-center font-mono text-sm text-stone-600">{item.qty}</TableCell>
              <TableCell class="py-4 text-right text-sm text-stone-500 tabular-nums">
                {t("common.currency_symbol")}
                {Number(item.price).toLocaleString(t("common.lang_code"))}
              </TableCell>
              <TableCell class="py-4 text-right text-sm font-bold text-stone-800 tabular-nums">
                {t("common.currency_symbol")}
                {Number(item.total).toLocaleString(t("common.lang_code"))}
              </TableCell>
            </TableRow>
          {/each}
        </Table>

        <div class="mt-8 space-y-3 border-t border-stone-100 pt-6">
          <div class="flex justify-between text-sm text-stone-500">
            <span>{t("orders.subtotal")}</span>
            <span class="font-mono font-medium"
              >{t("common.currency_symbol")} {Number(order.subtotal).toLocaleString(t("common.lang_code"))}</span
            >
          </div>
          {#if order.discountTotal > 0}
            <div class="flex justify-between text-sm text-rose-500">
              <span>{t("orders.discount")} {order.couponCode ? `(${order.couponCode})` : ""}</span>
              <span class="font-mono font-medium"
                >- {t("common.currency_symbol")}
                {Number(order.discountTotal).toLocaleString(t("common.lang_code"))}</span
              >
            </div>
          {/if}
          <div class="flex justify-between text-sm text-stone-500">
            <span>{t("orders.shipping_fee")}</span>
            <span class="font-mono font-medium"
              >{t("common.currency_symbol")}
              {Number(order.deliveryFee || 0).toLocaleString(t("common.lang_code"))}</span
            >
          </div>
          <div class="flex justify-between pt-2 text-xl font-black text-stone-900">
            <span>{t("orders.total")}</span>
            <span class="font-mono text-[#c48a3a]"
              >{t("common.currency_symbol")} {Number(order.total).toLocaleString(t("common.lang_code"))}</span
            >
          </div>
        </div>
      </PanelCard>
    </div>

    <!-- Logistics & Admin Notes -->
    <div class="flex flex-col gap-6">
      <PanelCard title={t("orders.shipping_info")}>
        <div class="space-y-4 text-sm">
          <div>
            <span class="text-[0.65rem] font-bold tracking-widest text-stone-400 uppercase">{t("orders.region")}</span>
            <p class="font-bold text-stone-800">
              {order.shippingAddress?.district || "-"}, {order.shippingAddress?.city || "-"}
            </p>
            <p class="text-xs text-stone-500">{order.shippingAddress?.province || "-"}</p>
          </div>
          <div>
            <span class="text-[0.65rem] font-bold tracking-widest text-stone-400 uppercase"
              >{t("orders.full_address")}</span
            >
            <p class="mt-1 leading-relaxed text-stone-600">
              {order.shippingAddress?.street || t("shipping.address_not_available")}
            </p>
          </div>
          {#if order.shippingAddress?.notes}
            <div class="rounded-xl border border-blue-100 bg-blue-50/30 p-3">
              <span class="text-[0.6rem] font-bold text-blue-500 uppercase">{t("orders.buyer_notes")}</span>
              <p class="mt-0.5 text-xs text-blue-900 italic">"{order.shippingAddress.notes}"</p>
            </div>
          {/if}
        </div>
      </PanelCard>

      <PanelCard title={t("orders.admin_control")}>
        <CrudInlineForm id="order-status-form" onsubmit={handleUpdateStatus} {isSubmitting}>
          <div class="flex flex-col gap-5">
            <SelectInput
              id="status"
              name="status"
              label={t("orders.order_flow")}
              bind:value={order.status}
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
              bind:value={order.paymentStatus}
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
              bind:value={() => order.notes || "", (v) => (order.notes = v)}
            />
            <Button type="submit" variant="primary" class="h-12 w-full shadow-lg" disabled={isSubmitting}>
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

            <div class="mt-2 flex gap-2">
              <Button variant="outline" class="flex-1 text-xs" href="/admin/fulfillment"
                >{t("orders.track_shipping")}</Button
              >
              <Button variant="outline" class="flex-1 text-xs" href="/admin/refunds">{t("orders.refund")}</Button>
            </div>
          </div>
        </CrudInlineForm>
      </PanelCard>
    </div>
  </div>
</div>

<ToastNotification bind:this={toastRef} />
