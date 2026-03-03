<script lang="ts">
import { trpc } from "../../../lib/trpc";
import { fade, fly } from "svelte/transition";
import { createQuery } from "@tanstack/svelte-query";
import { actions } from "astro:actions";
import AdminDataTable from "../AdminDataTable.svelte";
import CrudInlineForm from "../CrudInlineForm.svelte";
import SectionHeader from "../SectionHeader.svelte";
import StatusBadge from "../StatusBadge.svelte";
import ToastNotification from "../ToastNotification.svelte";

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
}: {
  rows?: InvoiceRow[];
  page?: number;
  limit?: number;
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

const badgeTone = (status: string) => {
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
      toastRef?.show("Invoice berhasil dibuat", "success");
      orderNo = "";
      invoicesQuery.refetch();
    }
  } finally {
    isSubmitting = false;
  }
};
</script>
<div class="w-full h-full">
<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
<SectionHeader title="Buat Invoice" badge="Manual" />
<CrudInlineForm
  id="invoice-form"
  onsubmit={handleSubmit}
  isSubmitting={isSubmitting}
>
  <div
    class="flex flex-col md:flex-row gap-4 xl:gap-6 items-end pb-8 border-b border-stone-100 mb-8 w-full"
  >
    <div class="space-y-1.5 w-full md:w-80">
      <label
        for="order_no"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Nomor Order</label
      >
      <input
        id="order_no"
        name="order_no"
        bind:value={orderNo}
        required
        placeholder="Cth: ORD-20240226-001"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-mono"
      />
    </div>
    <button
      class="flex items-center justify-center gap-3 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
      type="submit"
      disabled={isSubmitting || !orderNo}
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
      Terbitkan Invoice
    </button>
  </div>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader
    title="Daftar Invoice"
    muted="Auto update status di tahap berikutnya"
  />
</div>
<AdminDataTable class="mt-4">
  <thead>
    <tr>
      <th>Invoice</th>
      <th>Order</th>
      <th>Total</th>
      <th>Status</th>
      <th>Tanggal</th>
    </tr>
  </thead>
  <tbody>
    {#if currentInvoices.length === 0}
      <tr>
        <td colspan="5" class="text-center py-12 text-stone-400 text-sm italic">
          Belum ada invoice yang diterbitkan.
        </td>
      </tr>
    {/if}
    {#each currentInvoices as row (row.invoiceNo)}
      <tr
        transition:fade={{ duration: 200 }}
        class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
      >
        <td class="py-4 font-mono font-bold text-stone-900 border border-transparent px-3 py-1.5 rounded-lg transition-all">
          {row.invoiceNo}
        </td>
        <td class="py-4 font-mono font-medium text-stone-600 px-3 py-1.5">
          {row.orderNo}
        </td>
        <td class="py-4 font-mono font-bold text-stone-800 tabular-nums px-3 py-1.5">
          <span class="text-stone-400 text-xs mr-1 font-sans">Rp</span>{row.total?.toLocaleString("id-ID")}
        </td>
        <td class="py-4 px-3 py-1.5">
          <StatusBadge label={row.status} tone={badgeTone(row.status)} />
        </td>
        <td class="py-4 text-stone-500 text-sm font-medium px-3 py-1.5">
          {new Date(row.issuedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </td>
      </tr>
    {/each}
  </tbody>
</AdminDataTable>
</div>

<ToastNotification bind:this={toastRef} />

</div>
