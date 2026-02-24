<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import StatusBadge from "../StatusBadge.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import { getCsrfToken } from "../../../lib/admin-client";

  type RefundRow = {
    id: string | number;
    order_no: string;
    amount: number;
    status: string;
    provider_status?: string | null;
    reason?: string | null;
  };

  let { rows }: { rows: RefundRow[] } = $props();
  const csrfToken = getCsrfToken();

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    const response = await fetch("/api/admin/refunds", {
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

  const handleRowAction = async (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    if (!action) return;
    const row = target.closest("tr[data-id]");
    if (!row) return;
    const id = row.getAttribute("data-id");
    if (!id) return;

    if (action === "delete") {
      if (!confirm("Hapus refund ini?")) return;
      const response = await fetch(`/api/admin/refunds/${id}`, {
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
      const response = await fetch(`/api/admin/refunds/${id}`, {
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

<SectionHeader title="Buat Refund" />
<CrudInlineForm id="refund-form" on:submit={handleCreate}>
  <div>
    <label for="order_no">Order No</label>
    <input id="order_no" name="order_no" required />
  </div>
  <div>
    <label for="amount">Jumlah (Rp)</label>
    <input id="amount" name="amount" type="number" required />
  </div>
  <div>
    <label for="status">Status</label>
    <select id="status" name="status">
      <option value="requested">Requested</option>
      <option value="approved">Approved</option>
      <option value="rejected">Rejected</option>
    </select>
  </div>
  <div>
    <label for="reason">Alasan</label>
    <input id="reason" name="reason" />
  </div>
  <button class="primary" type="submit">Simpan</button>
</CrudInlineForm>

<div class="-mt-2 mb-4">
  <StatusBadge label="Dana Keluar" tone="danger" />
</div>

<div role="button" tabindex="0" onclick={handleRowAction} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}>
  <AdminDataTable>
    <thead>
      <tr>
        <th>Order</th>
        <th>Jumlah</th>
        <th>Status</th>
        <th>Gateway</th>
        <th>Alasan</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.id)}
        <tr data-id={row.id}>
          <td contenteditable="true" data-field="order_no">{row.order_no}</td>
          <td contenteditable="true" data-field="amount">{row.amount}</td>
          <td contenteditable="true" data-field="status">{row.status}</td>
          <td>{row.provider_status || "-"}</td>
          <td contenteditable="true" data-field="reason">{row.reason || ""}</td>
          <td>
            <RowActions />
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>
