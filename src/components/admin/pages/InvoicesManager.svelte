<script lang="ts" context="module">
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
  import { getCsrfToken, readError } from "../../../lib/admin-client";

  export let rows: InvoiceRow[] = [];
  let orderNo = "";
  const csrfToken = getCsrfToken();

  const formatCurrency = (value: number | undefined) =>
    `Rp ${Number(value ?? 0).toLocaleString("id-ID")}`;

  const badgeTone = (status: string) => {
    if (status === "paid") return "success";
    if (status === "void") return "danger";
    return "default";
  };

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    const response = await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
      body: data,
    });
    if (!response.ok) {
      alert(await readError(response));
      return;
    }
    location.reload();
  };
</script>

<SectionHeader title="Buat Invoice" badge="Manual" />
<CrudInlineForm id="invoice-form" on:submit={handleSubmit}>
  <div>
    <label for="order_no">Order No</label>
    <input id="order_no" name="order_no" bind:value={orderNo} required />
  </div>
  <button class="primary" type="submit">Buat Invoice</button>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader
    title="Daftar Invoice"
    muted="Auto update status di tahap berikutnya"
  />
</div>
<AdminDataTable>
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
    {#each rows as inv}
      <tr>
        <td>
          <a href={`/admin/invoices/${inv.invoice_no}`}>
            {inv.invoice_no}
          </a>
        </td>
        <td>{inv.order_no}</td>
        <td>{formatCurrency(inv.total)}</td>
        <td>
          <StatusBadge label={inv.status} tone={badgeTone(inv.status)} />
        </td>
        <td>{String(inv.issued_at).split("T")[0]}</td>
      </tr>
    {/each}
  </tbody>
</AdminDataTable>
