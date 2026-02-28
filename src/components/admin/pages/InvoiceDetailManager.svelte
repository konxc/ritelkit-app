<script lang="ts">
import { actions } from "astro:actions";
import CrudInlineForm from "../CrudInlineForm.svelte";
import PanelCard from "../PanelCard.svelte";
import StatusBadge from "../StatusBadge.svelte";
import ToastNotification from "../ToastNotification.svelte";

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

let { invoice: initialInvoice }: { invoice: InvoiceDetail } = $props();

let invoice = $state<InvoiceDetail>({} as InvoiceDetail);
$effect(() => {
	invoice = initialInvoice;
});
let toastRef = $state<ToastNotification>();
let isSubmitting = $state(false);

// Sync with initialInvoice from SSR
$effect(() => {
	invoice = initialInvoice;
});

const handleSubmit = async (event: SubmitEvent) => {
	event.preventDefault();
	const form = event.currentTarget as HTMLFormElement;
	const formData = new FormData(form);
	const data = {
		status: String(formData.get("status") || ""),
		dueAt: (String(formData.get("dueAt") || "") || null) as string | null,
	};

	isSubmitting = true;
	const { error } = await actions.updateInvoice({
		id: invoice.id,
		data,
	});
	isSubmitting = false;

	if (error) {
		toastRef?.show(error.message, "error");
	} else {
		invoice = {
			...invoice,
			...data,
		};
		toastRef?.show("Invoice diperbarui", "success");
	}
};
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
  <PanelCard>
    <strong>Order</strong>
    <p class="text-xl font-bold text-[#c48a3a] mb-2">{invoice.orderNo}</p>
    <div class="space-y-1">
      <p class="font-bold text-stone-900">{invoice.customerName}</p>
      <p class="text-stone-500 font-mono text-sm">{invoice.customerPhone}</p>
    </div>
  </PanelCard>

  <PanelCard>
    <strong>Status & Pembayaran</strong>
    <div class="mt-2 flex items-center gap-3">
      <StatusBadge
        label={invoice.status.toUpperCase()}
        tone={invoice.status === "paid"
          ? "success"
          : invoice.status === "overdue"
            ? "danger"
            : "default"}
      />
    </div>
    <p class="mt-4 text-xl font-bold text-stone-800 tabular-nums">
      Total: Rp {Number(invoice.total).toLocaleString("id-ID")}
    </p>
  </PanelCard>
</div>

<PanelCard className="mb-6">
  <strong>Alamat Pengiriman</strong>
  <p class="mt-2 font-medium text-stone-800">
    {invoice.shippingAddressJson?.province ?? "-"} › {invoice.shippingAddressJson?.city ?? "-"}
  </p>
  <p class="text-stone-600">{invoice.shippingAddressJson?.district ?? ""}</p>
</PanelCard>

<div class="mb-10 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
  <div class="px-6 py-4 bg-stone-50 border-b border-stone-200">
    <strong class="text-stone-900 uppercase tracking-widest text-xs">Rincian Item</strong>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-stone-50/50 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
          <th class="px-6 py-3">Produk</th>
          <th class="px-6 py-3 text-center">Qty</th>
          <th class="px-6 py-3 text-right">Harga</th>
          <th class="px-6 py-3 text-right">Total</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-100">
        {#each invoice.parsedItems as item (item.name)}
          <tr class="group hover:bg-stone-50/30 transition-colors">
            <td class="px-6 py-4 text-sm font-bold text-stone-900">{item.name}</td>
            <td class="px-6 py-4 text-sm text-stone-600 font-mono text-center">{item.qty}</td>
            <td class="px-6 py-4 text-sm text-stone-500 tabular-nums text-right">
              Rp {Number(item.price).toLocaleString("id-ID")}
            </td>
            <td class="px-6 py-4 text-sm font-bold text-stone-800 tabular-nums text-right">
              Rp {Number(item.total).toLocaleString("id-ID")}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<PanelCard className="border-t-4 border-t-[#c48a3a]">
  <strong class="block mb-6 uppercase tracking-widest text-xs text-stone-500">Perbarui Detail Invoice</strong>
  <CrudInlineForm
    id="invoice-form"
    data-invoice={invoice.invoiceNo}
    onsubmit={handleSubmit}
    isSubmitting={isSubmitting}
  >
    <div class="flex flex-col md:flex-row gap-6 items-end">
      <div class="space-y-1.5 w-full md:w-64">
        <label for="status" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</label>
        <select
          id="status"
          name="status"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold"
        >
          <option value="issued" selected={invoice.status === "issued"}>Issued</option>
          <option value="paid" selected={invoice.status === "paid"}>Paid</option>
          <option value="overdue" selected={invoice.status === "overdue"}>Overdue</option>
          <option value="void" selected={invoice.status === "void"}>Void</option>
        </select>
      </div>
      <div class="space-y-1.5 w-full md:w-64">
        <label for="dueAt" class="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Jatuh Tempo</label>
        <input
          id="dueAt"
          name="dueAt"
          type="date"
          value={invoice.dueAt ? String(invoice.dueAt).split('T')[0] : ""}
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <button
        class="flex items-center justify-center gap-3 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
        type="submit"
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <svg class="animate-spin -ml-1 mr-1 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        {/if}
        Simpan Perubahan
      </button>
    </div>
  </CrudInlineForm>
</PanelCard>

<ToastNotification bind:this={toastRef} />

