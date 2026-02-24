<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import { getCsrfToken } from "../../../lib/admin-client";

  type ShipmentRow = {
    id: string | number;
    order_no: string;
    status: string;
    carrier?: string | null;
    tracking_no?: string | null;
    notes?: string | null;
  };

  export let rows: ShipmentRow[] = [];
  const csrfToken = getCsrfToken();

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    const response = await fetch("/api/admin/shipments", {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
      body: data,
    });
    if (!response.ok) {
      alert(await response.text());
      return;
    }
    location.reload();
  };

  const handleTableClick = async (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    if (!action) return;
    const row = target.closest("tr[data-id]");
    if (!row) return;
    const id = row.getAttribute("data-id");
    if (!id) return;

    if (action === "delete") {
      if (!confirm("Hapus pengiriman ini?")) return;
      const response = await fetch(`/api/admin/shipments/${id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken },
      });
      if (!response.ok) {
        alert(await response.text());
        return;
      }
      location.reload();
      return;
    }

    if (action === "save") {
      const fields: Record<string, string> = {};
      row.querySelectorAll("[data-field]").forEach((cell) => {
        const field = cell.getAttribute("data-field");
        if (!field) return;
        if (
          cell instanceof HTMLSelectElement ||
          cell instanceof HTMLInputElement
        ) {
          fields[field] = String(cell.value);
          return;
        }
        fields[field] = String(cell.textContent?.trim() || "");
      });
      const response = await fetch(`/api/admin/shipments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(fields),
      });
      if (!response.ok) {
        alert(await response.text());
        return;
      }
      location.reload();
    }
  };
</script>

<SectionHeader title="Buat Pengiriman" badge="Tracking" />
<CrudInlineForm id="shipment-form" on:submit={handleCreate}>
  <div>
    <label for="order_no">Order No</label>
    <input id="order_no" name="order_no" required />
  </div>
  <div>
    <label for="carrier">Kurir</label>
    <input id="carrier" name="carrier" />
  </div>
  <div>
    <label for="tracking_no">Resi</label>
    <input id="tracking_no" name="tracking_no" />
  </div>
  <div>
    <label for="status">Status</label>
    <select id="status" name="status">
      <option value="packing">Packing</option>
      <option value="shipped">Dikirim</option>
      <option value="delivered">Terkirim</option>
      <option value="cancelled">Batal</option>
    </select>
  </div>
  <div>
    <label for="notes">Catatan</label>
    <input id="notes" name="notes" />
  </div>
  <button class="primary" type="submit">Simpan</button>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Pengiriman" />
</div>
<div role="button" tabindex="0" onclick={handleTableClick} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}>
  <AdminDataTable>
    <thead>
      <tr>
        <th>Order</th>
        <th>Status</th>
        <th>Kurir</th>
        <th>Resi</th>
        <th>Catatan</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.id)}
        <tr data-id={row.id}>
          <td contenteditable="true" data-field="order_no">{row.order_no}</td>
          <td contenteditable="true" data-field="status">{row.status}</td>
          <td contenteditable="true" data-field="carrier">{row.carrier || ""}</td>
          <td contenteditable="true" data-field="tracking_no">{row.tracking_no || ""}</td>
          <td contenteditable="true" data-field="notes">{row.notes || ""}</td>
          <td>
            <RowActions />
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>
