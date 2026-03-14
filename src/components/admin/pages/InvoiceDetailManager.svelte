<script lang="ts">
  let { invoice: initialInvoice, lang }: { invoice: InvoiceDetail; lang?: any } = $props();

  import { t, initI18n } from "@lib/i18n/store.svelte";
  import { untrack } from "svelte";
  initI18n(untrack(() => lang));

  import { trpc } from "@lib/trpc";
  import { createAdminMutation } from "@lib/admin-mutations.svelte";
  import CrudInlineForm from "@components/admin/CrudInlineForm.svelte";
  import PanelCard from "@components/admin/PanelCard.svelte";
  import Badge from "@components/admin/ui/Badge.svelte";
  import ToastNotification from "@components/admin/ToastNotification.svelte";
  import Button from "@components/admin/ui/Button.svelte";
  import SelectInput from "@components/admin/ui/forms/SelectInput.svelte";
  import TextInput from "@components/admin/ui/forms/TextInput.svelte";

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
      street?: string;
    };
  };

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

  function formatCurrency(n: number) {
    return Number(n).toLocaleString(t("common.lang_code"));
  }
</script>

<div class="mx-auto max-w-[1400px]">
  <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
    <!-- INVOICE PAPER (Left Column) -->
    <div
      class="col-span-1 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl shadow-stone-200/40 lg:col-span-8"
      id="printable-invoice"
    >
      <!-- Invoice Header -->
      <div
        class="flex flex-col items-start justify-between gap-6 border-b border-stone-200 bg-stone-50 p-8 sm:flex-row sm:p-12"
      >
        <div>
          <h1 class="text-4xl font-black tracking-tight text-[#865d25] uppercase">Invoice</h1>
          <p class="mt-2 flex items-center gap-2 font-mono text-sm font-semibold text-stone-500">
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline
                points="14 2 14 8 20 8"
              />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline
                points="10 9 9 9 8 9"
              />
            </svg>
            #{invoice.invoiceNo}
          </p>
        </div>
        <div class="text-left sm:text-right">
          <p class="mb-1 text-xl font-extrabold tracking-widest text-[#c48a3a] uppercase">Roti Sholawat</p>
          <p class="text-sm font-medium text-stone-500">contact@rotisholawat.com</p>
        </div>
      </div>

      <div class="p-8 sm:p-12">
        <div class="mb-12 grid grid-cols-1 gap-8 text-sm sm:grid-cols-2">
          <div class="rounded-2xl border border-stone-100 bg-stone-50/50 p-6">
            <p class="mb-3 flex items-center gap-2 text-[0.65rem] font-bold tracking-widest text-stone-400 uppercase">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              Billed To
            </p>
            <p class="text-base font-black text-stone-900">{invoice.customerName}</p>
            <p class="mt-1 font-mono text-sm text-stone-500">{invoice.customerPhone}</p>
            {#if invoice.shippingAddressJson && invoice.shippingAddressJson.province}
              <p class="mt-4 leading-relaxed text-stone-600">
                {invoice.shippingAddressJson.street || ""} <br />
                {invoice.shippingAddressJson.district || ""}, {invoice.shippingAddressJson.city || ""} <br />
                {invoice.shippingAddressJson.province || ""}
              </p>
            {/if}
          </div>
          <div class="flex flex-col gap-5 rounded-2xl border border-stone-100 bg-stone-50/50 p-6">
            <div>
              <p class="mb-1 flex items-center gap-2 text-[0.65rem] font-bold tracking-widest text-stone-400 uppercase">
                Order Reference
              </p>
              <p class="font-mono text-sm font-bold text-stone-800">{invoice.orderNo}</p>
            </div>
            <div>
              <p class="mb-1 flex items-center gap-2 text-[0.65rem] font-bold tracking-widest text-stone-400 uppercase">
                {t("invoices.due_date")}
              </p>
              <p class="text-sm font-bold text-stone-800">
                {invoice.dueAt ? String(invoice.dueAt).split("T")[0] : "Set upon saving"}
              </p>
            </div>
            <div class="mt-2">
              <Badge
                text={t(`invoices.status_${invoice.status}`).toUpperCase()}
                color={invoice.status === "paid" ? "green" : invoice.status === "overdue" ? "red" : "gray"}
              />
            </div>
          </div>
        </div>

        <!-- Invoice Items -->
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b-2 border-stone-100 text-[0.7rem] font-bold tracking-widest text-stone-400 uppercase">
                <th class="pb-4 font-extrabold">{t("orders.product")}</th>
                <th class="pb-4 text-center font-extrabold">{t("orders.qty")}</th>
                <th class="pb-4 text-right font-extrabold">{t("orders.price")}</th>
                <th class="pb-4 text-right font-extrabold">{t("orders.total")}</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              {#each invoice.parsedItems as item}
                <tr class="border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
                  <td class="py-5 font-bold text-stone-800">{item.name}</td>
                  <td class="py-5 text-center font-mono font-semibold text-stone-600">
                    <span class="rounded bg-stone-100 px-2 py-1">{item.qty}</span>
                  </td>
                  <td class="py-5 text-right font-medium text-stone-500">
                    <span class="mr-1 text-[0.7rem] text-stone-400">{t("common.currency_symbol")}</span>{formatCurrency(
                      item.price,
                    )}
                  </td>
                  <td class="py-5 text-right font-bold text-stone-800">
                    <span class="mr-1 text-[0.7rem] text-stone-400">{t("common.currency_symbol")}</span>{formatCurrency(
                      item.total,
                    )}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="mt-10 flex justify-end">
          <div
            class="relative w-full overflow-hidden rounded-2xl border border-[#c48a3a]/20 bg-[#faf9f7] p-8 shadow-sm sm:w-2/3 lg:w-[350px]"
          >
            <div class="absolute -top-10 -right-10 -z-0 h-40 w-40 rounded-full bg-[#c48a3a]/5"></div>

            <div
              class="relative z-10 mb-4 flex items-center justify-between border-b border-stone-200/50 pb-4 text-sm font-bold text-stone-600"
            >
              <span class="text-[0.7rem] tracking-widest uppercase">Subtotal</span>
              <span
                ><span class="mr-1 text-[0.7rem] text-stone-400">{t("common.currency_symbol")}</span>{formatCurrency(
                  invoice.total,
                )}</span
              >
            </div>
            <div
              class="relative z-10 mb-5 flex items-end justify-between border-b border-stone-200/50 pb-4 text-sm text-stone-900"
            >
              <span class="text-[0.7rem] font-bold tracking-widest text-stone-500 uppercase">Pajak / Biaya</span>
              <span class="font-mono text-stone-400">-</span>
            </div>
            <div class="relative z-10 flex items-center justify-between text-2xl font-black text-stone-900">
              <span class="text-[0.8rem] tracking-widest text-stone-800 uppercase">{t("common.total")}</span>
              <span class="text-[#865d25]"
                ><span class="mr-1 text-sm font-bold">{t("common.currency_symbol")}</span>{formatCurrency(
                  invoice.total,
                )}</span
              >
            </div>
          </div>
        </div>

        <div class="mt-20 border-t border-stone-100 pt-8 text-center text-xs text-stone-400 italic">
          Thank you for shopping at Roti Sholawat. For inquiries, please contact our support team.
        </div>
      </div>
    </div>

    <!-- RIGHT COLUMN: ACTIONS -->
    <div class="col-span-1 space-y-6 lg:col-span-4 print:hidden">
      <PanelCard class="border-t-4 border-t-[#c48a3a] bg-gradient-to-b from-white to-stone-50/50 shadow-sm">
        <h3 class="mb-6 flex items-center gap-2 text-sm font-black tracking-widest text-stone-900 uppercase">
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
            class="text-[#c48a3a]"
          >
            <path d="m18 5-3-3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" /><polyline
              points="8 10 12 14 16 10"
            /><line x1="12" x2="12" y1="14" y2="2" />
          </svg>
          {t("invoices.update_details")}
        </h3>
        <CrudInlineForm id="invoice-form" data-invoice={invoice.invoiceNo} onsubmit={handleSubmit} {isSubmitting}>
          <div class="space-y-5">
            <SelectInput
              id="status"
              name="status"
              label={t("common.status")}
              value={invoice.status}
              options={[
                { value: "issued", label: t("invoices.status_issued") || "Issued" },
                { value: "paid", label: t("invoices.status_paid") || "Paid" },
                { value: "overdue", label: t("invoices.status_overdue") || "Overdue" },
                { value: "void", label: t("invoices.status_void") || "Void" },
              ]}
            />
            <TextInput
              id="dueAt"
              name="dueAt"
              type="date"
              label={t("invoices.due_date")}
              value={invoice.dueAt ? String(invoice.dueAt).split("T")[0] : ""}
            />
            <Button
              type="submit"
              variant="primary"
              class="mt-4 h-12 w-full text-[0.85rem] shadow-lg shadow-[#c48a3a]/20 transition-transform hover:-translate-y-0.5"
              disabled={isSubmitting}
            >
              {#if isSubmitting}
                <svg
                  class="mr-2 h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
                  ></circle><path
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

      <div class="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          class="flex w-full items-center justify-center gap-2 border-stone-200 bg-white hover:bg-stone-50"
          onclick={() => window.print()}
        >
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
            class="text-stone-500"
            ><polyline points="6 9 6 2 18 2 18 9" /><path
              d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
            /><rect width="12" height="8" x="6" y="14" /></svg
          >
          Print Web
        </Button>

        <Button
          variant="outline"
          class="flex w-full items-center justify-center gap-2 border-stone-200 bg-white hover:bg-stone-50"
          onclick={() => alert("Download PDF (Coming soon)")}
        >
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
            class="text-stone-500"
            ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line
              x1="12"
              x2="12"
              y1="15"
              y2="3"
            /></svg
          >
          Save PDF
        </Button>
      </div>
    </div>
  </div>
</div>

<ToastNotification bind:this={toastRef} />

<style>
  @media print {
    :global(body) {
      background: white !important;
    }
    :global(nav),
    :global(header),
    :global(aside),
    .print\:hidden {
      display: none !important;
    }
    #printable-invoice {
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
  }
</style>
