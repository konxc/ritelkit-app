<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { fade, fly } from "svelte/transition";
  import { createQuery } from "@tanstack/svelte-query";
  import { actions } from "astro:actions";
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
  import { onMount } from "svelte";

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
    page = 1,
    limit = 20,
    lang,
  }: {
    rows?: InvoiceRow[];
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();
  const offset = $derived((page - 1) * limit);

  const invoicesQuery = createQuery(() => ({
    queryKey: ["invoices.list", { limit, offset }],
    queryFn: () => trpc.invoices.list.query({ limit, offset }),
    initialData: initialRows.length > 0 ? initialRows : undefined,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  }));

  let currentInvoices = $derived((invoicesQuery.data as InvoiceRow[]) || initialRows);

  let isSubmitting = $state(false);
  let orderNo = $state("");
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
        invoicesQuery.refetch();
      }
    } finally {
      isSubmitting = false;
    }
  };
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <SectionHeader title={t("invoices.title_create")} badge={t("invoices.badge_manual")} />
    <CrudInlineForm id="invoice-form" onsubmit={handleSubmit} {isSubmitting}>
      <div class="mb-8 flex w-full flex-col items-end gap-4 border-b border-stone-100 pb-8 md:flex-row xl:gap-6">
        <div class="w-full md:w-80">
          <TextInput
            id="order_no"
            name="order_no"
            label={t("invoices.order_no")}
            bind:value={orderNo}
            required
            placeholder={t("invoices.order_no_placeholder")}
            class="w-full font-mono"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          class="h-[42px] w-full px-8 md:w-auto"
          disabled={isSubmitting || !orderNo}
        >
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
          {t("invoices.generate")}
        </Button>
      </div>
    </CrudInlineForm>

    <div class="mt-6">
      <SectionHeader title={t("invoices.title_list")} muted={t("invoices.subtitle_list")} />
    </div>
    <div class="mt-4">
      <Table
        headers={[
          t("invoices.invoice_no"),
          t("common.order_no"),
          t("common.total"),
          t("common.status"),
          t("common.date"),
        ]}
      >
        {#if currentInvoices.length === 0}
          <TableRow>
            <TableCell colspan={5} class="py-12 text-center text-sm text-stone-400 italic">
              {t("invoices.empty")}
            </TableCell>
          </TableRow>
        {/if}
        {#each currentInvoices as row (row.invoiceNo)}
          <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
            <TableCell class="px-3 py-4 font-mono font-bold text-stone-900">
              {row.invoiceNo}
            </TableCell>
            <TableCell class="px-3 py-4 font-mono font-medium text-stone-600">
              {row.orderNo}
            </TableCell>
            <TableCell class="px-3 py-4 font-mono font-bold text-stone-800 tabular-nums">
              <span class="mr-1 font-sans text-xs text-stone-400">{t("common.currency_symbol")}</span
              >{row.total?.toLocaleString(t("common.lang_code"))}
            </TableCell>
            <TableCell class="px-3 py-4">
              <Badge variant={badgeTone(row.status)} showDot={true}>
                {t("status." + row.status) || row.status}
              </Badge>
            </TableCell>
            <TableCell class="px-3 py-4 text-sm font-medium text-stone-500">
              {new Date(row.issuedAt).toLocaleDateString(t("common.lang_code"), {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </TableCell>
          </TableRow>
        {/each}
      </Table>
    </div>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
