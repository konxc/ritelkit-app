<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { createQuery } from "@tanstack/svelte-query";
  import { actions } from "astro:actions";
  import Drawer from "../ui/overlay/Drawer.svelte";
  import Fab from "../ui/Fab.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import Badge from "../ui/Badge.svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import { onMount, untrack } from "svelte";
  import { fade, fly } from "svelte/transition";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import OrdersHeaderFilters from "../OrdersHeaderFilters.svelte";
  import ColumnVisibilityToggle from "../ui/ColumnVisibilityToggle.svelte";

  export type InvoiceRow = {
    id: string;
    invoiceNo: string;
    orderNo: string;
    total: number;
    status: string;
    issuedAt: string;
    dueAt: string | null;
  };

  let {
    rows: initialRows = [],
    total: initialTotal = 0,
    q = "",
    page = 1,
    limit = 20,
    lang,
  }: {
    rows?: InvoiceRow[];
    total?: number;
    q?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();

  initI18n(untrack(() => lang));

  const offset = $derived((page - 1) * limit);

  const invoicesQuery = createQuery(() => ({
    queryKey: ["invoices.list", { q, limit, offset }],
    queryFn: () => trpc.invoices.list.query({ q, limit, offset }),
    initialData: initialRows.length > 0 ? { rows: initialRows, total: initialTotal } : undefined,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  }));

  let currentInvoices = $derived((invoicesQuery.data?.rows as InvoiceRow[]) || initialRows);

  let columns = $state([
    { id: "invoiceNo", label: t("invoices.id"), isVisible: true, class: "font-mono font-bold text-[#c48a3a]" },
    { id: "orderNo", label: t("invoices.order_no"), isVisible: true, class: "font-mono font-medium text-stone-600" },
    {
      id: "total",
      label: t("orders.total"),
      isVisible: true,
      class: "font-mono font-bold text-stone-800 tabular-nums",
    },
    { id: "status", label: t("common.status"), isVisible: true, class: "" },
    { id: "issuedAt", label: t("invoices.issued_at"), isVisible: true, class: "hidden lg:table-cell" },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);

  let isSubmitting = $state(false);
  let orderNo = $state("");
  let isDrawerOpen = $state(false);
  let toastRef = $state<ToastNotification>();

  const badgeTone = (status: string): "success" | "danger" | "default" => {
    if (status === "paid") return "success";
    if (status === "void") return "danger";
    return "default";
  };

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    isSubmitting = true;
    try {
      const { error } = await actions.createInvoice({ orderNo });
      if (error) {
        toastRef?.show(error.message, "error");
      } else {
        toastRef?.show(t("invoices.toast_create"), "success");
        orderNo = "";
        isDrawerOpen = false;
        invoicesQuery.refetch();
      }
    } finally {
      isSubmitting = false;
    }
  };
</script>

{#snippet invoiceIcon()}
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
    ><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" /></svg
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
      form="invoice-form"
      variant="primary"
      class="relative flex h-11 flex-[2] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#c48a3a] px-8 py-0 font-black text-white shadow-[0_10px_30px_-10px_rgba(196,138,58,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_35px_-10px_rgba(196,138,58,0.6)] active:scale-[0.98] lg:h-[52px]"
      disabled={isSubmitting || !orderNo}
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
          <span class="text-[0.75rem] tracking-tight uppercase">{t("invoices.create_invoice")}</span>
        </div>
      {/if}
    </Button>
  </div>
{/snippet}

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
  <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
    <SectionHeader title={t("invoices.title_list")} muted={t("invoices.badge_manual")} />
    <div class="hidden lg:flex lg:items-center lg:gap-3">
      <div class="mr-2">
        <OrdersHeaderFilters tab="invoice" {q} {columns} />
      </div>

      <ColumnVisibilityToggle bind:columns />

      <div class="h-10 w-px bg-stone-200/80"></div>

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
          {t("invoices.create_invoice")}
        </div>
      </Button>
    </div>
  </div>

  <Fab onclick={() => (isDrawerOpen = true)} label={t("invoices.create_invoice")} />

  <Drawer
    bind:isOpen={isDrawerOpen}
    title={t("invoices.title_create")}
    subtitle={t("invoices.badge_manual")}
    icon={invoiceIcon}
    footer={drawerFooter}
  >
    <div class="flex h-full flex-col px-5 py-6 lg:px-7 lg:py-8">
      <CrudInlineForm id="invoice-form" onsubmit={handleSubmit} {isSubmitting}>
        <div class="space-y-6">
          <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
            {t("invoices.basic_info")}
          </h4>
          <div class="space-y-1.5">
            <div class="mb-1 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="8" x2="16" y1="10" y2="10"/><line x1="8" x2="16" y1="14" y2="14"/><line x1="8" x2="16" y1="18" y2="18"/></svg>
              <label for="order_no" class="text-[0.8rem] font-bold text-stone-600">{t("invoices.order_no")}</label>
            </div>
            <TextInput
              id="order_no"
              name="order_no"
              bind:value={orderNo}
              required
              placeholder={t("invoices.order_no_placeholder")}
              class="w-full font-mono ring-stone-100/50"
            />
          </div>
        </div>
      </CrudInlineForm>
    </div>
  </Drawer>

    <Table headers={activeHeaders}>
      {#if currentInvoices.length === 0}
        <TableEmptyState
          title={t("invoices.empty")}
          subtitle={t("common.no_results")}
          colspan={activeHeaders.length}
        />
      {/if}
    {#each currentInvoices as row (row.id)}
      <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
        {#if columns[0].isVisible}
          <TableCell class="py-4">
            <span class="font-mono font-bold text-[#c48a3a]">{row.invoiceNo}</span>
          </TableCell>
        {/if}
        {#if columns[1].isVisible}
          <TableCell class="py-4 font-mono font-medium text-stone-600">
            {row.orderNo}
          </TableCell>
        {/if}
        {#if columns[2].isVisible}
          <TableCell class="py-4 font-mono font-bold text-stone-800 tabular-nums">
            <span class="mr-1 text-xs text-stone-400">{t("common.currency_symbol")}</span>{row.total?.toLocaleString(
              t("common.lang_code"),
            )}
          </TableCell>
        {/if}
        {#if columns[3].isVisible}
          <TableCell class="py-4">
            <Badge variant={badgeTone(row.status)}>
              {t(`status.${row.status}`) || row.status}
            </Badge>
          </TableCell>
        {/if}
        {#if columns[4].isVisible}
          <TableCell class="py-4 text-sm font-medium text-stone-500">
            {new Date(row.issuedAt).toLocaleDateString(t("common.lang_code"), {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </TableCell>
        {/if}
        <TableCell align="center" class="py-4">
          <div class="flex items-center justify-center">
            <a
              href={`/admin/orders/${row.orderNo}`}
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-all hover:border-[#c48a3a] hover:text-[#c48a3a]"
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
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>
        </TableCell>
      </TableRow>
    {/each}
  </Table>

  <ToastNotification bind:this={toastRef} />
</div>

