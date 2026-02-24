<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import { getCsrfToken } from "../../../lib/admin-client";

  type UserRow = {
    id: string | number;
    email: string;
    role: string | null;
  };

  let { rows }: { rows: UserRow[] } = $props();

  const csrfToken = getCsrfToken();

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    const response = await fetch("/api/admin/users", {
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
      if (!confirm("Hapus admin ini?")) return;
      const response = await fetch(`/api/admin/users/${id}`, {
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
      const role = String(
        row.querySelector("[data-field='role']")?.textContent?.trim() || "",
      );
      const password = String(
        (row.querySelector("[data-field='password']") as HTMLInputElement | null)?.value ||
          "",
      );
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ role, password }),
      });
      if (!response.ok) {
        alert(await response.text());
        return;
      }
      location.reload();
    }
  };
</script>

<SectionHeader title="Tambah Admin" badge="Role" />
<CrudInlineForm id="user-form" on:submit={handleCreate}>
  <div>
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required />
  </div>
  <div>
    <label for="password">Password</label>
    <input id="password" name="password" type="password" required minlength="8" />
  </div>
  <div>
    <label for="role">Role</label>
    <select id="role" name="role">
      <option value="owner">Owner</option>
      <option value="admin">Admin</option>
      <option value="staff">Staff</option>
    </select>
  </div>
  <button class="primary" type="submit">Tambah</button>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Admin" muted="Edit role / reset password" />
</div>
<div role="button" tabindex="0" onclick={handleTableClick} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}>
  <AdminDataTable>
    <thead>
      <tr>
        <th>Email</th>
        <th>Role</th>
        <th>Password Baru</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.id)}
        <tr data-id={row.id}>
          <td>{row.email}</td>
          <td contenteditable="true" data-field="role">{row.role || "owner"}</td>
          <td>
            <input data-field="password" type="password" placeholder="Kosong = tidak diubah" />
          </td>
          <td>
            <RowActions />
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>
