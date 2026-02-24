<script lang="ts">
  import PanelCard from "../PanelCard.svelte";
  import StatusBadge from "../StatusBadge.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import { bindJsonForm, getCsrfToken } from "../../../lib/admin-client";
  import { onMount } from "svelte";

  export let invoice: any;
  const csrfToken = getCsrfToken();

  onMount(() => {
    bindJsonForm({
      formSelector: "#invoice-form",
      method: "PUT",
      endpoint: (form) =>
        `/api/admin/invoices/${encodeURIComponent(form.getAttribute("data-invoice") || "")}`,
    });
  });
</script>
<PanelCard>
  <strong>Order</strong>
  <p>{invoice.order_no}</p>
  <p class="muted">{invoice.customer_name}</p>
  <p class="muted">{invoice.customer_phone}</p>
</PanelCard>

<PanelCard>
  <strong>Status</strong>
  <p>
    <StatusBadge
      label={invoice.status}
      tone={invoice.status === "paid"
        ? "success"
        : invoice.status === "overdue"
          ? "danger"
          : "default"}
    />
  </p>
  <p class="muted">Total: Rp {Number(invoice.total).toLocaleString("id-ID")}</p>
</PanelCard>

<PanelCard className="mt-4">
  <strong>Alamat</strong>
  <p>{invoice.shipping_address_json?.province ?? "-"} - {invoice.shipping_address_json?.city ?? "-"}</p>
  <p>{invoice.shipping_address_json?.district ?? ""}</p>
</PanelCard>

<PanelCard className="mt-4">
  <strong>Item</strong>
  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th>Produk</th>
          <th>Qty</th>
          <th>Harga</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {#each invoice.parsedItems as item (item.name)}
          <tr>
            <td>{item.name}</td>
            <td>{item.qty}</td>
            <td>Rp {Number(item.price).toLocaleString("id-ID")}</td>
            <td>Rp {Number(item.total).toLocaleString("id-ID")}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</PanelCard>

<PanelCard className="mt-5">
  <strong>Update Invoice</strong>
  <CrudInlineForm id="invoice-form" data-invoice={invoice.invoice_no}>
    <div>
      <label for="status">Status</label>
      <input id="status" name="status" value={invoice.status} />
    </div>
    <div>
      <label for="due_at">Due At (YYYY-MM-DD)</label>
      <input id="due_at" name="due_at" value={invoice.due_at ?? ""} />
    </div>
    <button class="primary" type="submit">Update</button>
  </CrudInlineForm>
</PanelCard>
