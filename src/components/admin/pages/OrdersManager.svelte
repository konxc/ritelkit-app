<script lang="ts">
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { fade, fly } from "svelte/transition";
  import { trpc } from "../../../lib/trpc";
  import { onMount, untrack } from "svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import type { Order } from "../../../lib/types";
  import Drawer from "../ui/overlay/Drawer.svelte";
  import Fab from "../ui/Fab.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Badge from "../ui/Badge.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";

  let {
    rows: initialRows = [],
    total: initialTotal = 0,
    q = "",
    status = "",
    page = 1,
    limit = 20,
    lang,
  }: {
    rows?: OrderTableRow[];
    total?: number;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();

  initI18n(untrack(() => lang));

  const queryClient = useQueryClient();
  let toastRef = $state<ToastNotification>();
  let isSubmitting = $state(false);
  let isDrawerOpen = $state(false);

  let columns = $state([
    { id: "orderNo", label: t("orders.order_no"), isVisible: true, class: "font-mono font-bold text-stone-900" },
    { id: "customer", label: t("orders.customer"), isVisible: true, class: "font-medium text-stone-600" },
    {
      id: "total",
      label: t("orders.total"),
      isVisible: true,
      class: "font-mono font-bold text-stone-800 tabular-nums",
    },
    { id: "status", label: t("orders.status"), isVisible: true, class: "" },
    { id: "payment", label: t("orders.payment"), isVisible: true, class: "" },
    { id: "date", label: t("orders.date"), isVisible: true, class: "hidden lg:table-cell" },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);

  type OrderTableRow = Pick<
    Order,
    "id" | "orderNo" | "customerName" | "total" | "status" | "paymentStatus" | "createdAt"
  >;

  let localQ = $state(untrack(() => q));
  let localStatus = $state(untrack(() => status));
  let localPage = $state(untrack(() => page));

  const offset = $derived((localPage - 1) * limit);

  const ordersQuery = createQuery(() => ({
    queryKey: ["orders.list", { q: localQ, status: localStatus, limit, offset: (localPage - 1) * limit }],
    queryFn: () =>
      trpc.orders.list.query({
        q: localQ,
        status: localStatus ? [localStatus] : undefined,
        limit,
        offset: (localPage - 1) * limit,
      }),
    initialData:
      initialRows.length > 0
        ? {
            rows: initialRows,
            total: initialTotal || initialRows.length,
            totalPages: Math.ceil((initialTotal || initialRows.length) / limit),
          }
        : undefined,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  }));

  let currentRows = $derived((ordersQuery.data?.rows as OrderTableRow[]) || initialRows);

  function syncFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    localQ = params.get("q") || "";
    localStatus = params.get("status") || "";
    localPage = parseInt(params.get("page") || "1", 10);
  }

  onMount(() => {
    syncFiltersFromUrl();
    window.addEventListener("popstate", syncFiltersFromUrl);
    window.addEventListener("astro:after-navigation", syncFiltersFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFiltersFromUrl);
      window.removeEventListener("astro:after-navigation", syncFiltersFromUrl);
    };
  });

  const getStatusType = (status: string) => {
    if (!status) return "default";
    switch (status.toLowerCase()) {
      case "completed":
        return "success";
      case "processing":
      case "shipped":
        return "warning";
      case "pending":
        return "default";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  const getPaymentStatusType = (status: string) => {
    if (!status) return "default";
    switch (status.toLowerCase()) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "failed":
      case "expired":
        return "danger";
      default:
        return "default";
    }
  };

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    isSubmitting = true;
    try {
      // Basic manual order creation
      const data = {
        orderNo: `MAN-${Date.now().toString().slice(-6)}`,
        status: (formData.get("status") as string) || "pending",
        paymentStatus: (formData.get("paymentStatus") as string) || "unpaid",
        customerName: formData.get("customerName") as string,
        customerPhone: formData.get("customerPhone") as string,
        customerEmail: formData.get("customerEmail") as string,
        shippingAddressJson: JSON.stringify({ address: formData.get("address") }),
        itemsJson: "[]", // Simplified for now
        subtotal: Number(formData.get("total")),
        discountTotal: 0,
        deliveryFee: 0,
        total: Number(formData.get("total")),
        notes: formData.get("notes") as string || t("orders.manual_order_note"),
      };

      await trpc.orders.create.mutate(data);
      toastRef?.show(t("orders.toast_add"), "success");
      queryClient.invalidateQueries({ queryKey: ["orders.list"] });
      isDrawerOpen = false;
    } catch (error: any) {
      toastRef?.show(error.message || t("common.error_occurred"), "error");
    } finally {
      isSubmitting = false;
    }
  };
</script>

{#snippet orderIcon()}
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
    ><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path
      d="M16 10a4 4 0 0 1-8 0"
    /></svg
  >
{/snippet}

{#snippet drawerFooter()}
  <div class="flex items-center gap-3">
    <button
      type="button"
      class="h-11 flex-1 rounded-2xl border border-stone-200 bg-white text-[0.7rem] font-black tracking-widest text-stone-400 uppercase transition-all hover:bg-stone-50 hover:text-stone-600 focus:outline-none active:scale-95 lg:h-[52px]"
      onclick={() => (isDrawerOpen = false)}
    >
      {t("common.cancel")}
    </button>
    <Button
      type="submit"
      form="order-form"
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
          <span class="text-xs">{t("common.saving")}</span>
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
            stroke-linejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg
          >
          <span class="text-[0.75rem] tracking-tight uppercase">{t("orders.save")}</span>
        </div>
      {/if}
    </Button>
  </div>
{/snippet}

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("orders.title_list")} muted={t("orders.subtitle_list")} />
      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="order" q={localQ} status={localStatus} bind:columns {lang} />

        <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex items-center gap-2">
          <div class="flex items-center gap-2">
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
            {t("orders.add_order")}
          </div>
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("orders.add_order")} />

    <Drawer
      bind:isOpen={isDrawerOpen}
      title={t("orders.title_add")}
      subtitle={t("orders.subtitle_add")}
      icon={orderIcon}
      footer={drawerFooter}
      maxWidth="md"
    >
      <div class="flex h-full flex-col px-5 py-6 lg:px-7 lg:py-8">
        <form id="order-form" onsubmit={handleSubmit} class="space-y-8">
          <div class="space-y-6">
            <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
              {t("orders.customer_info")}
            </h4>
            <div class="space-y-4">
              <div class="space-y-1.5">
                <div class="mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <label for="customerName" class="text-[0.8rem] font-bold text-stone-600">{t("orders.customer")}</label>
                </div>
                <TextInput 
                  id="customerName" 
                  name="customerName" 
                  required 
                  placeholder={t("customers.name_placeholder")}
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <label for="customerPhone" class="text-[0.8rem] font-bold text-stone-600">{t("orders.phone")}</label>
                  </div>
                  <TextInput 
                    id="customerPhone" 
                    name="customerPhone" 
                    required 
                    placeholder={t("customers.phone_placeholder")}
                  />
                </div>
                <div class="space-y-1.5">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <label for="customerEmail" class="text-[0.8rem] font-bold text-stone-600">{t("orders.email")}</label>
                  </div>
                  <TextInput 
                    id="customerEmail" 
                    name="customerEmail" 
                    placeholder={t("customers.email_placeholder")}
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <div class="mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  <label for="address" class="text-[0.8rem] font-bold text-stone-600">{t("orders.address")}</label>
                </div>
                <TextInput 
                  id="address" 
                  name="address" 
                  required 
                  placeholder={t("orders.address_placeholder") || "e.g. Jl. Raya No. 123"}
                />
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
              {t("orders.payment_info")}
            </h4>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <label for="status" class="text-[0.8rem] font-bold text-stone-600">{t("orders.status")}</label>
                  </div>
                  <SelectInput
                    id="status"
                    name="status"
                    placeholder={t("orders.select_status")}
                    options={[
                      { value: "pending", label: t("orders.statuses.pending") },
                      { value: "processing", label: t("orders.statuses.processing") },
                      { value: "completed", label: t("orders.statuses.completed") },
                      { value: "cancelled", label: t("orders.statuses.cancelled") },
                    ]}
                    value="pending"
                  />
                </div>
                <div class="space-y-1.5">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    <label for="paymentStatus" class="text-[0.8rem] font-bold text-stone-600">{t("orders.payment_status")}</label>
                  </div>
                  <SelectInput
                    id="paymentStatus"
                    name="paymentStatus"
                    placeholder={t("orders.select_payment")}
                    options={[
                      { value: "unpaid", label: t("orders.payments.unpaid") },
                      { value: "paid", label: t("orders.payments.paid") },
                      { value: "failed", label: t("orders.payments.failed") },
                    ]}
                    value="unpaid"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <div class="mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <label for="total" class="text-[0.8rem] font-bold text-stone-600">{t("orders.total")}</label>
                </div>
                <TextInput 
                  id="total" 
                  name="total" 
                  type="number" 
                  required 
                  placeholder={t("orders.total_placeholder")}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </Drawer>

    <Table headers={activeHeaders}>
      {#if currentRows.length === 0}
        <TableEmptyState
          title={t("orders.empty")}
          subtitle={t("common.no_results")}
          colspan={activeHeaders.length}
        />
      {/if}
      {#each currentRows as order (order.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          {#if columns[0].isVisible}
            <TableCell class="py-4">
              <span class="font-mono font-bold text-[#c48a3a]">{order.orderNo}</span>
            </TableCell>
          {/if}
          {#if columns[1].isVisible}
            <TableCell class="py-4">
              <div class="flex items-center gap-2 font-bold text-stone-900">
                <span
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-[10px] text-stone-500"
                  >👤</span
                >
                {order.customerName}
              </div>
            </TableCell>
          {/if}
          {#if columns[2].isVisible}
            <TableCell class="py-4 font-mono font-bold text-stone-800 tabular-nums">
              <span class="mr-1 text-xs text-stone-400">{t("common.currency_symbol")}</span
              >{order.total?.toLocaleString(t("common.lang_code"))}
            </TableCell>
          {/if}
          {#if columns[3].isVisible}
            <TableCell class="py-4">
              <Badge variant={getStatusType(order.status)}>
                {t(`orders.statuses.${order.status?.toLowerCase()}`) || order.status}
              </Badge>
            </TableCell>
          {/if}
          {#if columns[4].isVisible}
            <TableCell class="py-4">
              <Badge variant={getPaymentStatusType(order.paymentStatus)}>
                {t(`orders.payments.${order.paymentStatus?.toLowerCase()}`) || order.paymentStatus}
              </Badge>
            </TableCell>
          {/if}
          {#if columns[5].isVisible}
            <TableCell class="py-4 text-sm font-medium text-stone-500">
              {new Date(order.createdAt).toLocaleDateString(t("common.lang_code"), {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </TableCell>
          {/if}

          <TableCell align="center" class="py-4">
            <div class="flex items-center justify-center">
              <RowActions detailHref={`/admin/orders/${order.orderNo}`} showSave={false} showDelete={false} />
            </div>
          </TableCell>
        </TableRow>
      {/each}
    </Table>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
