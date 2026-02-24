<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import { getCsrfToken } from "../../../lib/admin-client";

  type AdRow = {
    id: string | number;
    name: string;
    channel: string;
    budget: number;
    spend: number;
    status: string;
  };

  let { rows }: { rows: AdRow[] } = $props();
  const csrfToken = getCsrfToken();

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    const response = await fetch("/api/admin/ads", {
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

  const handleRowClick = async (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    if (!action) return;
    const row = target.closest("tr[data-id]");
    if (!row) return;
    const id = row.getAttribute("data-id");
    if (!id) return;

    if (action === "delete") {
      if (!confirm("Hapus campaign ini?")) return;
      const response = await fetch(`/api/admin/ads/${id}`, {
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
        fields[field] = String(cell.textContent?.trim() || "");
      });
      const response = await fetch(`/api/admin/ads/${id}`, {
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

<SectionHeader title="Buat Campaign" badge="Ads" />
<CrudInlineForm id="ads-form" onsubmit={handleCreate}>
  <div>
    <label>Nama Campaign</label>
    <input name="name" required />
  </div>
  <div>
    <label>Channel</label>
    <input name="channel" placeholder="IG / FB / WA / Google" required />
  </div>
  <div>
    <label>Budget (Rp)</label>
    <input name="budget" type="number" required />
  </div>
  <div>
    <label>Status</label>
    <select name="status">
      <option value="draft">Draft</option>
      <option value="active">Active</option>
      <option value="paused">Paused</option>
      <option value="completed">Completed</option>
    </select>
  </div>
  <div>
    <label>Tanggal Mulai</label>
    <input name="start_at" type="date" />
  </div>
  <div>
    <label>Tanggal Selesai</label>
    <input name="end_at" type="date" />
  </div>
  <div>
    <label>Catatan</label>
    <input name="notes" />
  </div>
  <button class="primary" type="submit">Simpan</button>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Campaign" />
</div>
<div onclick={handleRowClick}>
  <AdminDataTable>
    <thead>
      <tr>
        <th>Nama</th>
        <th>Channel</th>
        <th>Budget</th>
        <th>Spend</th>
        <th>Status</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.id)}
        <tr data-id={row.id}>
          <td contenteditable="true" data-field="name">{row.name}</td>
          <td contenteditable="true" data-field="channel">{row.channel}</td>
          <td contenteditable="true" data-field="budget">{row.budget}</td>
          <td contenteditable="true" data-field="spend">{row.spend}</td>
          <td contenteditable="true" data-field="status">{row.status}</td>
          <td>
            <RowActions />
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>
