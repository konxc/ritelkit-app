<script lang="ts">
  import SectionHeader from "../SectionHeader.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import PanelCard from "../PanelCard.svelte";
  import StatusBadge from "../StatusBadge.svelte";
  import { bindJsonForm, getCsrfToken } from "../../../lib/admin-client";
  import { onMount } from "svelte";

  export let order: any;
  const csrfToken = getCsrfToken();

  onMount(() => {
    bindJsonForm({
      formSelector: "#order-status-form",
      method: "PUT",
      endpoint: (form) =>
        `/api/admin/orders/${encodeURIComponent(form.getAttribute("data-order") || order.order_no)}`,
      mapPayload: (formData) => {
        const payload = Object.fromEntries(formData.entries());
        delete payload.order_id;
        return payload;
      },
    });
  });
</script>

<PanelCard>
  <strong>Pelanggan</strong>
  <p>{order.customer_name}</p>
  <p class="muted">{order.customer_phone}</p>
  <p class="muted">{order.customer_email}</p>
</PanelCard>

<PanelCard>
  <strong>Status</strong>
  <p>
    <StatusBadge
      label={order.status}
      tone={order.status === "processing" ? "success" : "default"}
    />
    <StatusBadge
      label={order.payment_status}
      tone={order.payment_status === "paid"
        ? "success"
        : order.payment_status === "failed"
          ? "danger"
          : "default"}
    />
  </p>
  <p class="muted">Total: Rp {Number(order.total).toLocaleString("id-ID")}</p>
</PanelCard>

<PanelCard className="mt-4">
  <strong>Alamat</strong>
  <p>{order.shipping_address_json?.province ?? "-"} - {order.shipping_address_json?.city ?? "-"}</p>
  <p>{order.shipping_address_json?.district ?? ""}</p>
  <p class="muted">
    Tanggal: {order.shipping_address_json?.delivery_date || "-"} | Jam: {order.shipping_address_json?.delivery_time || "-"}
  </p>
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
          {#each order.parsedItems as item (item.name)}
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

<SectionHeader title="Update Status" muted="Gunakan status konsisten" />
<CrudInlineForm id="order-status-form" data-order={order.order_no}>
  <input type="hidden" name="order_id" value={order.id} />
  <div>
    <label for="status">Status</label>
    <input id="status" name="status" value={order.status} />
  </div>
  <div>
    <label for="payment_status">Payment Status</label>
    <input id="payment_status" name="payment_status" value={order.payment_status} />
  </div>
  <div>
    <label for="notes">Catatan</label>
    <input id="notes" name="notes" />
  </div>
  <button class="primary" type="submit">Update Status</button>
</CrudInlineForm>
