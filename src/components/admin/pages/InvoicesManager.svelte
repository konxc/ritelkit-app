<script module lang="ts">
  export type InvoiceRow = {
    invoice_no: string;
    order_no: string;
    total: number;
    status: string;
    issued_at: string | Date;
  };
</script>

<script lang="ts">
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import AdminDataTable from "../AdminDataTable.svelte";
  import StatusBadge from "../StatusBadge.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { trpc } from "../../../lib/trpc";
  import {
    createQuery,
    createMutation,
    useQueryClient,
  } from "@tanstack/svelte-query";

  let { rows: initialRows = [] }: { rows: any[] } = $props();

  const queryClient = useQueryClient();
  let orderNo = $state("");
  let toastRef = $state<ToastNotification>();

  const invoicesQuery = createQuery({
    queryKey: ["invoices"],
    queryFn: () => trpc.invoices.list.query(),
    initialData: () => initialRows,
  });

  const createInvoiceMutation = createMutation({
    mutationFn: (data: { orderNo: string }) =>
      trpc.invoices.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toastRef?.show("Invoice berhasil dibuat", "success");
      orderNo = "";
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const formatCurrency = (value: number | undefined) =>
    `Rp ${Number(value ?? 0).toLocaleString("id-ID")}`;

  const badgeTone = (status: string) => {
    if (status === "paid") return "success";
    if (status === "void") return "danger";
    return "default";
  };

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    createInvoiceMutation.mutate({ orderNo });
  };

  const currentInvoices = $derived($invoicesQuery.data || initialRows);
</script>

<SectionHeader title="Buat Invoice" badge="Manual" />
<CrudInlineForm
  id="invoice-form"
  on:submit={handleSubmit}
  isSubmitting={$createInvoiceMutation.isPending}
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
      disabled={$createInvoiceMutation.isPending || !orderNo}
    >
      {#if $createInvoiceMutation.isPending}
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
        <td colspan="5" class="text-center py-12 text-stone-400 text-sm italic"
          >Belum ada invoice diterbitkan.</td
        >
      </tr>
    {/if}
    {#each currentInvoices as inv (inv.invoiceNo)}
      <tr
        class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
      >
        <td class="py-4">
          <a
            href={`/admin/invoices/${inv.invoiceNo}`}
            class="font-bold text-stone-900 hover:text-[#c48a3a] underline decoration-stone-200 underline-offset-4 transition-colors"
          >
            {inv.invoiceNo}
          </a>
        </td>
        <td class="py-4 font-mono text-xs text-stone-500">{inv.orderNo}</td>
        <td class="py-4 tabular-nums font-bold text-stone-800"
          >{formatCurrency(inv.total)}</td
        >
        <td class="py-4">
          <StatusBadge
            label={inv.status.toUpperCase()}
            tone={badgeTone(inv.status)}
          />
        </td>
        <td class="py-4 font-mono text-xs text-stone-400"
          >{String(inv.issuedAt).split("T")[0]}</td
        >
      </tr>
    {/each}
  </tbody>
</AdminDataTable>

<ToastNotification bind:this={toastRef} />
