<script lang="ts">
  import { trpc } from "../../../lib/trpc";
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
  import { untrack } from "svelte";

  type InvoiceItem = {
    name: string;
    qty: number;
    price: number;
    total: number;
  };
  type InvoiceDetail = {
    id: string;
    invoiceNo: string;
    orderNo: string;
    customerName: string;
    customerPhone: string;
    total: number;
    status: string;
    dueAt?: string | null;
    parsedItems: InvoiceItem[];
    shippingAddressJson?: {
      province?: string;
      city?: string;
      district?: string;
    };
  };

  let { invoice: initialInvoice, lang }: { invoice: InvoiceDetail; lang?: any } = $props();

  initI18n(untrack(() => lang));

  let invoice = $state<InvoiceDetail>({ ...initialInvoice });
  let toastRef = $state<ToastNotification>();

  const updateMutation = createAdminMutation(
    (payload: { id: string; data: any }) => trpc.invoices.update.mutate(payload),
    {
      successMessage: t("invoices.toast_update"),
      onSuccess: (_: any, vars: { id: string; data: any }) => {
        invoice = {
          ...invoice,
          ...vars.data,
        };
      },
    },
    () => toastRef,
  );

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const data = {
      status: String(formData.get("status") || ""),
      dueAt: (String(formData.get("dueAt") || "") || null) as string | null,
    };

    await updateMutation.mutate({
      id: invoice.id,
      data,
    });
  };

  let isSubmitting = $derived(updateMutation.isPending);
</script>

<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
  <PanelCard>
    <strong>{t("invoices.detail_order")}</strong>
    <p class="mb-2 text-xl font-bold text-[#c48a3a]">{invoice.orderNo}</p>
    <div class="space-y-1">
      <p class="font-bold text-stone-900">{invoice.customerName}</p>
      <p class="font-mono text-sm text-stone-500">{invoice.customerPhone}</p>
    </div>
  </PanelCard>

  <PanelCard>
    <strong>{t("invoices.status_payment")}</strong>
    <div class="mt-2 flex items-center gap-3">
      <Badge
        text={t(`invoices.status_${invoice.status}`).toUpperCase()}
        color={invoice.status === "paid" ? "green" : invoice.status === "overdue" ? "red" : "gray"}
      />
    </div>
    <p class="mt-4 text-xl font-bold text-stone-800 tabular-nums">
      {t("common.total")}: {t("common.currency_symbol")}
      {Number(invoice.total).toLocaleString(t("common.lang_code"))}
    </p>
  </PanelCard>
</div>

<PanelCard class="mb-6">
  <strong>{t("invoices.shipping_address")}</strong>
  <p class="mt-2 font-medium text-stone-800">
    {invoice.shippingAddressJson?.province ?? "-"} › {invoice.shippingAddressJson?.city ?? "-"}
  </p>
  <p class="text-stone-600">{invoice.shippingAddressJson?.district ?? ""}</p>
</PanelCard>

<div class="mb-10 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
  <div class="border-b border-stone-200 bg-stone-50 px-6 py-4">
    <strong class="text-xs tracking-widest text-stone-900 uppercase">{t("orders.item_details")}</strong>
  </div>
  <div>
    <Table headers={[t("orders.product"), t("orders.qty"), t("orders.price"), t("orders.total")]}>
      {#each invoice.parsedItems as item (item.name)}
        <TableRow class="group transition-colors hover:bg-stone-50/30">
          <TableCell class="px-6 py-4 text-sm font-bold text-stone-900">{item.name}</TableCell>
          <TableCell class="px-6 py-4 text-center font-mono text-sm text-stone-600">{item.qty}</TableCell>
          <TableCell class="px-6 py-4 text-right text-sm text-stone-500 tabular-nums">
            {t("common.currency_symbol")}
            {Number(item.price).toLocaleString(t("common.lang_code"))}
          </TableCell>
          <TableCell class="px-6 py-4 text-right text-sm font-bold text-stone-800 tabular-nums">
            {t("common.currency_symbol")}
            {Number(item.total).toLocaleString(t("common.lang_code"))}
          </TableCell>
        </TableRow>
      {/each}
    </Table>
  </div>
</div>

<PanelCard class="border-t-4 border-t-[#c48a3a]">
  <strong class="mb-6 block text-xs tracking-widest text-stone-500 uppercase">{t("invoices.update_details")}</strong>
  <CrudInlineForm id="invoice-form" data-invoice={invoice.invoiceNo} onsubmit={handleSubmit} {isSubmitting}>
    <div class="flex flex-col items-end gap-6 md:flex-row">
      <div class="w-full md:w-64">
        <SelectInput
          id="status"
          name="status"
          label={t("common.status")}
          value={invoice.status}
          options={[
            { value: "issued", label: t("invoices.status_issued") },
            { value: "paid", label: t("invoices.status_paid") },
            { value: "overdue", label: t("invoices.status_overdue") },
            { value: "void", label: t("invoices.status_void") },
          ]}
        />
      </div>
      <div class="w-full md:w-64">
        <TextInput
          id="dueAt"
          name="dueAt"
          type="date"
          label={t("invoices.due_date")}
          value={invoice.dueAt ? String(invoice.dueAt).split("T")[0] : ""}
        />
      </div>
      <Button type="submit" variant="primary" class="h-[42px] w-full px-8 md:w-auto" disabled={isSubmitting}>
        {#if isSubmitting}
          <svg
            class="mr-1 -ml-1 inline-block h-4 w-4 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
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
    </div>
  </CrudInlineForm>
</PanelCard>

<ToastNotification bind:this={toastRef} />
