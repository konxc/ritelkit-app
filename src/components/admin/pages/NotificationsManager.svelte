<script lang="ts">
  import { actions } from "astro:actions";
  import type { Notification } from "../../../lib/types";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import Textarea from "../ui/forms/Textarea.svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import { onMount } from "svelte";

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
    const { data, error } = await actions.listNotifications({
      q,
      limit,
      offset,
    });
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
      toastRef?.show(t("notifications.toast_save"), "success");
      form.reset();
      refreshData();
    }
  };

  const handleRowAction = async (id: string, action: string, rowEl: HTMLElement | null) => {
    if (action === "delete") {
      if (!confirm(t("notifications.confirm_delete"))) return;
      deletingId = id;
      const { error } = await actions.deleteNotification(id);
      deletingId = null;

      if (error) {
        toastRef?.show(error.message, "error");
      } else {
        toastRef?.show(t("notifications.toast_delete"), "success");
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
        toastRef?.show(t("notifications.toast_send"), "success");
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
        toastRef?.show(t("notifications.toast_update"), "success");
        refreshData();
      }
    }
  };
</script>

<SectionHeader title={t("notifications.title_create")} badge={t("notifications.badge_manual")} />
<CrudInlineForm id="notif-form" onsubmit={handleCreate} {isSubmitting}>
  <div class="mb-4 w-full space-y-4 border-b border-stone-100 pb-8">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <SelectInput
          id="channel"
          name="channel"
          label={t("notifications.label_channel")}
          options={[
            { value: "whatsapp", label: "WhatsApp" },
            { value: "email", label: "Email" },
          ]}
        />
      </div>
      <div>
        <TextInput id="recipient" name="recipient" label={t("notifications.label_recipient")} required />
      </div>
      <div>
        <TextInput
          id="template"
          name="template"
          label={t("notifications.label_template")}
          placeholder={t("notifications.placeholder_template")}
        />
      </div>
      <div class="col-span-1 md:col-span-2">
        <Textarea
          id="payload_json"
          name="payload_json"
          label={t("notifications.label_payload")}
          rows={3}
          placeholder={t("notifications.placeholder_payload")}
          class="font-mono text-sm"
        />
      </div>
    </div>
    <Button type="submit" variant="primary" class="h-[42px] px-8" disabled={isSubmitting}>
      {#if isSubmitting}
        <svg
          class="mr-1 -ml-1 inline-block h-4 w-4 animate-spin text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path></svg
        >
      {/if}
      {t("notifications.button_save")}
    </Button>
  </div>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title={t("notifications.title_log")} />
</div>
<div class="mt-2">
  <Table
    headers={[
      t("notifications.label_channel"),
      t("notifications.label_recipient"),
      t("common.status"),
      t("notifications.header_created"),
      t("notifications.header_sent"),
      t("common.actions"),
    ]}
  >
    {#if rows.length === 0}
      <TableRow>
        <TableCell colspan={6} class="py-12 text-center text-sm text-stone-400 italic">
          {t("notifications.empty_log")}
        </TableCell>
      </TableRow>
    {/if}
    {#each rows as row (row.id)}
      <TableRow
        data-id={row.id}
        class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50"
      >
        <TableCell class="py-4">
          <div
            contenteditable="true"
            data-field="channel"
            class="rounded-lg border border-transparent px-3 py-1.5 font-medium text-stone-900 transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
          >
            {row.channel}
          </div>
        </TableCell>
        <TableCell class="py-4">
          <div
            contenteditable="true"
            data-field="recipient"
            class="rounded-lg border border-transparent px-3 py-1.5 font-medium text-stone-900 transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
          >
            {row.recipient}
          </div>
        </TableCell>
        <TableCell class="py-4">
          <div
            contenteditable="true"
            data-field="status"
            class="rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold text-stone-500 transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
          >
            {t("status." + row.status) || row.status}
          </div>
        </TableCell>
        <TableCell class="px-3 py-1.5 py-4 font-mono text-sm text-stone-500"
          >{String(row.createdAt || "-").split("T")[0]}</TableCell
        >
        <TableCell class="px-3 py-1.5 py-4 font-mono text-sm text-stone-500"
          >{row.sentAt ? String(row.sentAt).split("T")[0] : "-"}</TableCell
        >
        <TableCell class="py-4 pr-4 text-right">
          <RowActions
            showSend={true}
            onSend={() => handleRowAction(row.id, "send", null)}
            onSave={(e) => handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
            onDelete={() => handleRowAction(row.id, "delete", null)}
            isSending={sendingId === row.id}
            isSaving={savingId === row.id}
            isDeleting={deletingId === row.id}
          />
        </TableCell>
      </TableRow>
    {/each}
  </Table>
</div>

<ToastNotification bind:this={toastRef} />
