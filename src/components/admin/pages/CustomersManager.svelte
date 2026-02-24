<script lang="ts" context="module">
  export type CustomerRow = {
    id: string | number;
    name: string;
    phone: string;
    email?: string | null;
    notes?: string | null;
  };
</script>

<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import RowActions from "../RowActions.svelte";
  import { getCsrfToken } from "../../../lib/admin-client";

  export let rows: CustomerRow[] = [];
  const csrfToken = getCsrfToken();

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    const response = await fetch("/api/admin/customers", {
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
    const id = row.getAttribute("data:id") || row.getAttribute("data-id");
    if (!id) return;

    if (action === "delete") {
      if (!confirm("Hapus pelanggan ini?")) return;
      const response = await fetch(`/api/admin/customers/${id}`, {
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
      const response = await fetch(`/api/admin/customers/${id}`, {
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

<SectionHeader title="Tambah Pelanggan" badge="CRM" />
<CrudInlineForm id="customer-form" on:submit={handleCreate}>
  <div>
    <label for="name">Nama</label>
    <input id="name" name="name" required />
  </div>
  <div>
    <label for="phone">Telepon</label>
    <input id="phone" name="phone" required />
  </div>
  <div>
    <label for="email">Email</label>
    <input id="email" name="email" type="email" />
  </div>
  <div>
    <label for="notes">Catatan</label>
    <textarea id="notes" name="notes" rows="2"></textarea>
  </div>
  <button class="primary" type="submit">Simpan</button>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Pelanggan" muted="Cari detail lalu klik"/>
</div>
<div role="button" tabindex="0" onclick={handleRowAction} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}>
  <AdminDataTable>
    <thead>
      <tr>
        <th>Nama</th>
        <th>Telepon</th>
        <th>Email</th>
        <th>Catatan</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.id)}
        <tr data-id={row.id}>
          <td contenteditable="true" data-field="name">{row.name}</td>
          <td contenteditable="true" data-field="phone">{row.phone}</td>
          <td contenteditable="true" data-field="email">{row.email || ""}</td>
          <td contenteditable="true" data-field="notes">{row.notes || ""}</td>
          <td>
            <RowActions detailHref={`/admin/customers/${row.id}`} />
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>
