<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import { getCsrfToken } from "../../../lib/admin-client";

  type NotificationRow = {
    id: string | number;
    channel: string;
    recipient: string;
    status: string;
    created_at: string;
    sent_at?: string | null;
  };

  export let rows: NotificationRow[] = [];
  const csrfToken = getCsrfToken();

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    const response = await fetch("/api/admin/notifications", {
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
      if (!confirm("Hapus notifikasi ini?")) return;
      const response = await fetch(`/api/admin/notifications/${id}`, {
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

    if (action === "send") {
      const response = await fetch(`/api/admin/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ id }),
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
      const response = await fetch(`/api/admin/notifications/${id}`, {
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

<SectionHeader title="Buat Notifikasi" badge="Manual Send" />
<CrudInlineForm id="notif-form" on:submit={handleCreate}>
  <div>
    <label for="channel">Channel</label>
    <select id="channel" name="channel">
      <option value="whatsapp">WhatsApp</option>
      <option value="email">Email</option>
    </select>
  </div>
  <div>
    <label for="recipient">Penerima</label>
    <input id="recipient" name="recipient" required />
  </div>
  <div>
    <label for="template">Template</label>
    <input id="template" name="template" placeholder="opsional" />
  </div>
  <div>
    <label for="payload_json">Payload (JSON)</label>
    <textarea id="payload_json"
      name="payload_json"
      rows="3"
      placeholder={'{"message":"..."}'}
    ></textarea>
  </div>
  <button class="primary" type="submit">Simpan</button>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Log Notifikasi" />
</div>
<div role="button" tabindex="0" onclick={handleRowAction} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}>
  <AdminDataTable>
    <thead>
      <tr>
        <th>Channel</th>
        <th>Penerima</th>
        <th>Status</th>
        <th>Created</th>
        <th>Sent</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.id)}
        <tr data-id={row.id}>
          <td contenteditable="true" data-field="channel">{row.channel}</td>
          <td contenteditable="true" data-field="recipient">{row.recipient}</td>
          <td contenteditable="true" data-field="status">{row.status}</td>
          <td>{String(row.created_at).split("T")[0]}</td>
          <td>{row.sent_at ? String(row.sent_at).split("T")[0] : "-"}</td>
          <td>
            <RowActions showSend={true} />
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>
