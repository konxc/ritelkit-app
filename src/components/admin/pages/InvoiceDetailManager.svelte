<script lang="ts">
import { actions } from "astro:actions";
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
    toastRef?.show("Faktur diperbarui", "success");
  }
};
</script>

<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
  <PanelCard>
    <strong>Pesanan</strong>
    <p class="mb-2 text-xl font-bold text-[#c48a3a]">{invoice.orderNo}</p>
    <div class="space-y-1">
      <p class="font-bold text-stone-900">{invoice.customerName}</p>
      <p class="font-mono text-sm text-stone-500">{invoice.customerPhone}</p>
    </div>
  </PanelCard>

  <PanelCard>
    <strong>Status & Pembayaran</strong>
    <div class="mt-2 flex items-center gap-3">
      <Badge
        text={invoice.status.toUpperCase()}
        color={invoice.status === "paid" ? "green" : invoice.status === "overdue" ? "red" : "gray"}
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

<div class="mb-10 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
  <div class="border-b border-stone-200 bg-stone-50 px-6 py-4">
    <strong class="text-xs tracking-widest text-stone-900 uppercase">Rincian Item</strong>
  </div>
  <div>
    <Table headers={["Produk", "Qty", "Harga", "Total"]}>
      {#each invoice.parsedItems as item (item.name)}
        <TableRow class="group transition-colors hover:bg-stone-50/30">
          <TableCell class="px-6 py-4 text-sm font-bold text-stone-900">{item.name}</TableCell>
          <TableCell class="px-6 py-4 text-center font-mono text-sm text-stone-600">{item.qty}</TableCell>
          <TableCell class="px-6 py-4 text-right text-sm text-stone-500 tabular-nums">
            Rp {Number(item.price).toLocaleString("id-ID")}
          </TableCell>
          <TableCell class="px-6 py-4 text-right text-sm font-bold text-stone-800 tabular-nums">
            Rp {Number(item.total).toLocaleString("id-ID")}
          </TableCell>
        </TableRow>
      {/each}
    </Table>
  </div>
</div>

<PanelCard className="border-t-4 border-t-[#c48a3a]">
  <strong class="mb-6 block text-xs tracking-widest text-stone-500 uppercase">Perbarui Detail Faktur</strong>
  <CrudInlineForm id="invoice-form" data-invoice={invoice.invoiceNo} onsubmit={handleSubmit} {isSubmitting}>
    <div class="flex flex-col items-end gap-6 md:flex-row">
      <div class="w-full md:w-64">
        <SelectInput
          id="status"
          name="status"
          label="Status"
          value={invoice.status}
          options={[
            { value: "issued", label: "Issued" },
            { value: "paid", label: "Dibayar" },
            { value: "overdue", label: "Overdue" },
            { value: "void", label: "Void" },
          ]}
        />
      </div>
      <div class="w-full md:w-64">
        <TextInput
          id="dueAt"
          name="dueAt"
          type="date"
          label="Jatuh Tempo"
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
        Simpan Perubahan
      </Button>
    </div>
  </CrudInlineForm>
</PanelCard>

<ToastNotification bind:this={toastRef} />
