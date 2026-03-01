<script lang="ts">
import { actions } from "astro:actions";
import type { Notification } from "../../../lib/types";
import AdminDataTable from "../AdminDataTable.svelte";
import CrudInlineForm from "../CrudInlineForm.svelte";
import RowActions from "../RowActions.svelte";
import SectionHeader from "../SectionHeader.svelte";
import ToastNotification from "../ToastNotification.svelte";

let {
  initialRows = [],
  q = "",
  page = 1,
  limit = 30,
}: {
  initialRows?: Notification[];
  q?: string;
  page?: number;
  limit?: number;
} = $props();

let toastRef = $state<ToastNotification>();
let rows = $state<Notification[]>([]);
let isSubmitting = $state(false);
let savingId = $state<string | null>(null);
let sendingId = $state<string | null>(null);
let deletingId = $state<string | null>(null);

// Sync with initialRows from SSR
$effect(() => {
  rows = initialRows;
});

const refreshData = async () => {
  const offset = (page - 1) * limit;
  const { data, error } = await actions.listNotifications({ q, limit, offset });
  if (!error && data) {
    rows = data.rows as Notification[];
  }
};

const handleCreate = async (event: SubmitEvent) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement | null;
  if (!form) return;
  const formData = new FormData(form);

  const data = {
    channel: String(formData.get("channel") || ""),
    recipient: String(formData.get("recipient") || ""),
    template: String(formData.get("template") || "") || undefined,
    payloadJson: String(formData.get("payload_json") || "") || undefined,
  };

  isSubmitting = true;
  const { error } = await actions.createNotification(data);
  isSubmitting = false;

  if (error) {
    toastRef?.show(error.message, "error");
  } else {
    toastRef?.show("Notifikasi disimpan", "success");
    form.reset();
    refreshData();
  }
};

const handleRowAction = async (id: string, action: string, rowEl: HTMLElement | null) => {
  if (action === "delete") {
    if (!confirm("Hapus notifikasi ini?")) return;
    deletingId = id;
    const { error } = await actions.deleteNotification(id);
    deletingId = null;

    if (error) {
      toastRef?.show(error.message, "error");
    } else {
      toastRef?.show("Notifikasi dihapus", "success");
      refreshData();
    }
    return;
  }

  if (action === "send") {
    sendingId = id;
    const { error } = await actions.sendNotification(id);
    sendingId = null;

    if (error) {
      toastRef?.show(error.message, "error");
    } else {
      toastRef?.show("Notifikasi dikirim", "success");
      refreshData();
    }
    return;
  }

  if (action === "save" && rowEl) {
    const fields: Record<string, string> = {};
    rowEl.querySelectorAll("[data-field]").forEach((cell) => {
      const field = cell.getAttribute("data-field");
      if (!field) return;
      fields[field] = String(cell.textContent?.trim() || "");
    });

    savingId = id;
    const { error } = await actions.updateNotification({
      id,
      data: {
        channel: fields.channel || "",
        recipient: fields.recipient || "",
        status: fields.status || "pending",
      },
    });
    savingId = null;

    if (error) {
      toastRef?.show(error.message, "error");
    } else {
      toastRef?.show("Notifikasi diperbarui", "success");
      refreshData();
    }
  }
};
</script>

<SectionHeader title="Buat Notifikasi" badge="Manual Send" />
<CrudInlineForm id="notif-form" onsubmit={handleCreate} {isSubmitting}>
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
		<textarea
			id="payload_json"
			name="payload_json"
			rows="3"
			placeholder="Isi JSON payload"
		></textarea>
	</div>
	<button class="primary" type="submit" disabled={isSubmitting}>
		{#if isSubmitting}
			<svg
				class="animate-spin -ml-1 mr-1 h-4 w-4 text-white inline-block"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				><circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
				></circle><path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path></svg
			>
		{/if}
		Simpan
	</button>
</CrudInlineForm>

<div class="mt-6">
	<SectionHeader title="Log Notifikasi" />
</div>
<div class="mt-2">
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
					<td>{String(row.createdAt || "-").split("T")[0]}</td>
					<td>{row.sentAt ? String(row.sentAt).split("T")[0] : "-"}</td>
					<td>
						<RowActions
							showSend={true}
							onSend={() => handleRowAction(row.id, "send", null)}
							onSave={(e) =>
								handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
							onDelete={() => handleRowAction(row.id, "delete", null)}
							isSending={sendingId === row.id}
							isSaving={savingId === row.id}
							isDeleting={deletingId === row.id}
						/>
					</td>
				</tr>
			{/each}
		</tbody>
	</AdminDataTable>
</div>

<ToastNotification bind:this={toastRef} />
