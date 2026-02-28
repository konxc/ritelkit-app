<script lang="ts">
import { actions } from "astro:actions";
import { fade, fly } from "svelte/transition";
import type { AdminUser } from "../../../lib/types";
import AdminDataTable from "../AdminDataTable.svelte";
import CrudInlineForm from "../CrudInlineForm.svelte";
import RowActions from "../RowActions.svelte";
import SectionHeader from "../SectionHeader.svelte";
import ToastNotification from "../ToastNotification.svelte";

let { rows: initialRows = [] }: { rows?: AdminUser[] } = $props();

let toastRef = $state<ToastNotification>();
let rows = $state<AdminUser[]>([]);
let isSubmitting = $state(false);
let savingId = $state<string | null>(null);
let deletingId = $state<string | null>(null);

// Sync with initialRows from SSR
$effect(() => {
	rows = initialRows;
});

const refreshData = async () => {
	const { data, error } = await actions.listAdminUsers({});
	if (!error && data) {
		rows = data as AdminUser[];
	}
};

const handleCreate = async (event: SubmitEvent) => {
	event.preventDefault();
	const form = event.currentTarget as HTMLFormElement | null;
	if (!form) return;
	const formData = new FormData(form);
	const data = {
		email: String(formData.get("email") || ""),
		password: String(formData.get("password") || ""),
		role: String(formData.get("role") || "admin") as "owner" | "admin" | "editor",
	};

	isSubmitting = true;
	const { error } = await actions.createAdminUser(data);
	isSubmitting = false;

	if (error) {
		toastRef?.show(error.message, "error");
	} else {
		toastRef?.show("Admin ditambahkan", "success");
		await refreshData();
		form.reset();
	}
};

const handleRowAction = async (
	id: string,
	action: string,
	rowEl: HTMLElement | null,
) => {
	if (action === "delete") {
		if (!confirm("Hapus admin ini?")) return;
		deletingId = id;
		const { error } = await actions.deleteAdminUser(id);
		deletingId = null;
		if (error) {
			toastRef?.show(error.message, "error");
		} else {
			toastRef?.show("Admin dihapus", "success");
			await refreshData();
		}
		return;
	}

	if (action === "save" && rowEl) {
		const role = String(
			rowEl.querySelector("[data-field='role']")?.textContent?.trim() || "",
		);
		const password = String(
			(
				rowEl.querySelector(
					"[data-field='password']",
				) as HTMLInputElement | null
			)?.value || "",
		);

		savingId = id;
		// Standardized updateAdminUser in index.ts
		const { error } = await actions.updateAdminUser({
			id,
			data: {
				role: role as "owner" | "admin" | "editor",
				password: password || undefined,
			},
		});
		savingId = null;

		if (error) {
			toastRef?.show(error.message, "error");
		} else {
			toastRef?.show("Admin diperbarui", "success");
			await refreshData();
		}
	}
};
</script>
<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
<SectionHeader title="Tambah Admin" badge="Role" />
<CrudInlineForm
  id="user-form"
  onsubmit={handleCreate}
  isSubmitting={isSubmitting}
>
  <div>
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required />
  </div>
  <div>
    <label for="password">Password</label>
    <input
      id="password"
      name="password"
      type="password"
      required
      minlength="8"
    />
  </div>
  <div>
    <label for="role">Role</label>
    <select id="role" name="role">
      <option value="owner">Owner</option>
      <option value="admin">Admin</option>
      <option value="editor">Editor</option>
    </select>
  </div>
  <button class="primary" type="submit" disabled={isSubmitting}>Tambah</button>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Admin" muted="Edit role / reset password" />
</div>
<div class="mt-2">
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
        <tr
          transition:fade={{ duration: 200 }}
          data-id={row.id}
        >
          <td>{row.email}</td>
          <td contenteditable="true" data-field="role">{row.role || "owner"}</td
          >
          <td>
            <input
              data-field="password"
              type="password"
              placeholder="Kosong = tidak diubah"
            />
          </td>
          <td>
            <RowActions
              isSaving={savingId === row.id}
              isDeleting={deletingId === row.id}
              onSave={(e) =>
                handleRowAction(row.id, "save", e.currentTarget.closest("tr")!)}
              onDelete={() => handleRowAction(row.id, "delete", null)}
            />
          </td>
        </tr>
      {/each}
</tbody>
  </AdminDataTable>
</div>
</div>

<ToastNotification bind:this={toastRef} />
