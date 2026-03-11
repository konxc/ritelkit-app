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
  import { fade, fly } from "svelte/transition";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import ColumnVisibilityToggle from "../ui/ColumnVisibilityToggle.svelte";
  import Fab from "../ui/Fab.svelte";
  import Drawer from "../ui/overlay/Drawer.svelte";
  import InlineEditableField from "../ui/forms/InlineEditableField.svelte";

  let {
    rows: initialRows = [],
    q = "",
    page = 1,
    limit = 30,
    lang,
  }: {
    rows?: Notification[];
    q?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();

  let columns = $state([
    { id: "kanal", label: t("notifications.label_channel"), isVisible: true },
    { id: "penerima", label: t("notifications.label_recipient"), isVisible: true },
    { id: "status", label: t("common.status"), isVisible: true },
    { id: "dibuat", label: t("notifications.header_created"), isVisible: true },
    { id: "terkirim", label: t("notifications.header_sent"), isVisible: true },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);

  let toastRef = $state<ToastNotification>();
  let rows = $state<Notification[]>([]);
  let isSubmitting = $state(false);
  let savingId = $state<string | null>(null);
  let sendingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);
  let isDrawerOpen = $state(false);

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

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("notifications.title_log")} muted={t("notifications.badge_manual")} />
      
      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <div class="mr-2">
          <AdminHeaderFilters tab="notifications" {q} {columns} />
        </div>

        <ColumnVisibilityToggle bind:columns />

        <div class="h-10 w-px bg-stone-200/80"></div>

        <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex items-center gap-2">
          <div class="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
            >
            {t("notifications.title_create")}
          </div>
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("notifications.title_create")} />

    {#snippet notifIcon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
    {/snippet}

    {#snippet drawerFooter()}
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="h-11 flex-1 rounded-2xl border border-stone-200 bg-white text-[0.7rem] font-black tracking-widest text-stone-400 uppercase transition-all hover:bg-stone-50 hover:text-stone-600 focus:outline-none active:scale-95 lg:h-[52px]"
          onclick={() => (isDrawerOpen = false)}
        >
          {t("common.cancel")}
        </button>
        <Button
          type="submit"
          form="notif-form"
          variant="primary"
          class="relative flex h-11 flex-[2] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#c48a3a] px-8 py-0 font-black text-white shadow-[0_10px_30px_-10px_rgba(196,138,58,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_35px_-10px_rgba(196,138,58,0.6)] active:scale-[0.98] lg:h-[52px]"
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <div class="flex items-center gap-3">
              <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span class="text-xs">{t("common.saving")}</span>
            </div>
          {:else}
            <div class="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
              <span class="text-[0.75rem] tracking-tight uppercase">{t("notifications.button_save")}</span>
            </div>
          {/if}
        </Button>
      </div>
    {/snippet}

    <Drawer
      bind:isOpen={isDrawerOpen}
      title={t("notifications.title_create")}
      subtitle={t("notifications.badge_manual")}
      icon={notifIcon}
      footer={drawerFooter}
      maxWidth="lg"
    >
      <div class="px-5 py-6 lg:px-7 lg:py-8">
        <CrudInlineForm id="notif-form" onsubmit={handleCreate} {isSubmitting}>
          <div class="space-y-6">
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
                  rows={4}
                  placeholder={t("notifications.placeholder_payload")}
                  class="font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </CrudInlineForm>
      </div>
    </Drawer>

    <div class="mt-2">
      <Table headers={activeHeaders}>
        {#if rows.length === 0}
          <TableEmptyState
            title={t("notifications.empty_log")}
            subtitle=""
            colspan={activeHeaders.length}
          />
        {/if}
        {#each rows as row (row.id)}
          <TableRow
            data-id={row.id}
            class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50"
          >
            {#if columns[0].isVisible}
              <TableCell class="py-4">
                <InlineEditableField
                  value={row.channel}
                  field="channel"
                  ariaLabel={t("notifications.label_channel")}
                  class="font-medium text-stone-900"
                />
              </TableCell>
            {/if}
            {#if columns[1].isVisible}
              <TableCell class="py-4">
                <InlineEditableField
                  value={row.recipient}
                  field="recipient"
                  ariaLabel={t("notifications.label_recipient")}
                  class="font-medium text-stone-900"
                />
              </TableCell>
            {/if}
            {#if columns[2].isVisible}
              <TableCell class="py-4">
                <InlineEditableField
                  value={row.status}
                  field="status"
                  ariaLabel={t("common.status")}
                  class="text-sm font-semibold text-stone-500"
                >
                  {t("status." + row.status) || row.status}
                </InlineEditableField>
              </TableCell>
            {/if}
            {#if columns[3].isVisible}
              <TableCell class="py-4 font-mono text-xs text-stone-400">
                {String(row.createdAt || "-").split("T")[0]}
              </TableCell>
            {/if}
            {#if columns[4].isVisible}
              <TableCell class="py-4 font-mono text-xs text-stone-400">
                {row.sentAt ? String(row.sentAt).split("T")[0] : "-"}
              </TableCell>
            {/if}
            <TableCell align="center" class="py-4">
              <div class="flex items-center justify-center">
                <RowActions
                  showSend={true}
                  onSend={() => handleRowAction(row.id, "send", null)}
                  onSave={(e) => handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
                  onDelete={() => handleRowAction(row.id, "delete", null)}
                  isSending={sendingId === row.id}
                  isSaving={savingId === row.id}
                  isDeleting={deletingId === row.id}
                />
              </div>
            </TableCell>
          </TableRow>
        {/each}
      </Table>
    </div>
  </div>
</div>

<ToastNotification bind:this={toastRef} />
