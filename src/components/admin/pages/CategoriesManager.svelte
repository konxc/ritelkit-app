<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import { collectRowFields, getCsrfToken } from "../../../lib/admin-client";

  type CategoryRow = {
    id: string | number;
    name: string;
    slug: string | null;
    sort_order: number;
    is_active: boolean;
  };

  let { rows }: { rows: CategoryRow[] } = $props();

  const csrfToken = getCsrfToken();

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    const response = await fetch("/api/admin/categories", {
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
      if (!confirm("Hapus kategori ini?")) return;
      const response = await fetch(`/api/admin/categories/${id}`, {
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
      const payload = collectRowFields(row);
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        alert(await response.text());
        return;
      }
      location.reload();
    }
  };
</script>

<SectionHeader title="Tambah Kategori" badge="Kelola menu" />
<CrudInlineForm id="category-form" on:submit={handleCreate}>
  <div>
    <label for="name">Nama Kategori</label>
    <input id="name" name="name" required />
  </div>
  <div>
    <label for="slug">Slug</label>
    <input id="slug" name="slug" placeholder="opsional" />
  </div>
  <div>
    <label for="sort_order">Urutan</label>
    <input id="sort_order" name="sort_order" type="number" value="0" />
  </div>
  <div>
    <label for="is_active">Aktif</label>
    <select id="is_active" name="is_active">
      <option value="true">Ya</option>
      <option value="false">Tidak</option>
    </select>
  </div>
  <button class="primary" type="submit">Tambah Kategori</button>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Kategori" muted="Klik sel untuk edit" />
</div>
<div role="button" tabindex="0" onclick={handleTableClick} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}>
  <AdminDataTable>
    <thead>
      <tr>
        <th>Nama</th>
        <th>Slug</th>
        <th>Urutan</th>
        <th>Status</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.id)}
        <tr data-id={row.id}>
          <td contenteditable="true" data-field="name">{row.name}</td>
          <td contenteditable="true" data-field="slug">{row.slug || ""}</td>
          <td contenteditable="true" data-field="sort_order">{row.sort_order}</td>
          <td>
            <select data-field="is_active">
              <option value="true" selected={row.is_active}>Aktif</option>
              <option value="false" selected={!row.is_active}>Nonaktif</option>
            </select>
          </td>
          <td>
            <RowActions />
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>
