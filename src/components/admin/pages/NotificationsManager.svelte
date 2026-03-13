<script lang="ts">
  let {
    rows: initialRows = [],
    total = 0,
    q = "",
    status = "",
    page = 1,
    limit = 30,
    lang,
  }: {
    rows?: Notification[];
    total?: number;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();
  initI18n(untrack(() => lang));

  import { trpc } from "../../../lib/trpc";
  import { createQuery } from "@tanstack/svelte-query";
  import type { Notification } from "../../../lib/types";
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
  import { untrack } from "svelte";
  import { fly } from "svelte/transition";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import Fab from "../ui/Fab.svelte";
  import AdminDrawerForm from "../ui/overlay/AdminDrawerForm.svelte";
  import { createAdminFilters } from "../../../lib/admin-filters.svelte";
  import { createAdminMutation } from "../../../lib/admin-mutations.svelte";
  import { createTableState } from "../../../lib/admin-table-state.svelte";
  import PaginationNav from "../PaginationNav.svelte";
  import { onMount } from "svelte";

  let columns = $state([
    { id: "kanal", label: t("notifications.label_channel"), isVisible: true },
    { id: "penerima", label: t("notifications.label_recipient"), isVisible: true },
    { id: "status", label: t("common.status"), isVisible: true },
    { id: "dibuat", label: t("notifications.header_created"), isVisible: true },
    { id: "terkirim", label: t("notifications.header_sent"), isVisible: true },
  ]);

  const filters = createAdminFilters({ q: untrack(() => q), status: untrack(() => status), page: untrack(() => page) });
  const localLimit = untrack(() => limit) || 30;

  let toastRef = $state<ToastNotification>();
  let isDrawerOpen = $state(false);
  let processingId = $state<string | null>(null);

  const query = createQuery(() => ({
    queryKey: ["notifications", filters.q, filters.status, filters.page],
    queryFn: () =>
      trpc.notifications.list.query({
        q: filters.q,
        status: filters.status ? filters.status : undefined,
        limit: localLimit,
        offset: (filters.page - 1) * localLimit,
      }),
    initialData: filters.isInitial ? { rows: initialRows, count: total || 0 } : undefined,
  }));

  const currentRows = $derived(query.data?.rows || []);
  const totalPages = $derived(Math.max(1, Math.ceil((query.data?.count || 0) / localLimit)));
  const tableState = createTableState<Notification>(() => currentRows);

  const sendMutation = createAdminMutation(
    (id: string) => trpc.notifications.send.mutate(id),
    {
      invalidateKeys: [["notifications"]],
      successMessage: t("notifications.toast_sent"),
    },
    () => toastRef,
  );

  const deleteMutation = createAdminMutation(
    (id: string) => trpc.notifications.delete.mutate(id),
    {
      invalidateKeys: [["notifications"]],
      successMessage: t("notifications.toast_deleted"),
    },
    () => toastRef,
  );

  const createMutation = createAdminMutation(
    (data: any) => trpc.notifications.create.mutate(data),
    {
      invalidateKeys: [["notifications"]],
      successMessage: t("notifications.toast_created"),
      onSuccess: () => {
        isDrawerOpen = false;
      },
    },
    () => toastRef,
  );

  const handleSend = async (id: string) => {
    processingId = id;
    try {
      await sendMutation.mutate(id);
    } finally {
      processingId = null;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("common.confirm_delete"))) return;
    processingId = id;
    try {
      await deleteMutation.mutate(id);
    } finally {
      processingId = null;
    }
  };

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const data = {
      channel: String(formData.get("channel")),
      recipient: String(formData.get("recipient")),
      template: String(formData.get("title")),
      payloadJson: String(formData.get("payloadJson") || "{}"),
    };
    await createMutation.mutate(data);
  };

  const activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);

  const getStatusType = (status: string) => {
    switch (status?.toLowerCase()) {
      case "sent":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "danger";
      default:
        return "default";
    }
  };
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("notifications.title_log")} muted={t("notifications.empty_log")} />

      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="notifications" q={filters.q} status={filters.status} bind:columns {lang} />

        <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex items-center gap-2">
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
            ><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" /><path
              d="m22 9-10 7L2 9"
            /></svg
          >
          {t("notifications.title_create")}
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("notifications.title_create")} />

    {#snippet notificationIcon()}
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
        ><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" /><path
          d="m22 9-10 7L2 9"
        /></svg
      >
    {/snippet}

    <AdminDrawerForm
      bind:isOpen={isDrawerOpen}
      title={t("notifications.title_create")}
      subtitle={t("notifications.empty_log")}
      icon={notificationIcon}
      isSubmitting={createMutation.isPending}
      onsubmit={handleCreate}
      formId="notification-form"
    >
      <div class="space-y-6">
        <SelectInput id="channel" name="channel" label={t("notifications.label_channel")} value="email">
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="push">Push Notification</option>
        </SelectInput>
        <TextInput id="recipient" name="recipient" label={t("notifications.label_recipient")} required />
        <TextInput id="title" name="title" label={t("notifications.label_template")} required />
        <Textarea id="body" name="body" label={t("notifications.label_payload")} rows={4} required />
        <Textarea id="payloadJson" name="payloadJson" label="Payload (JSON)" />
      </div>
    </AdminDrawerForm>

    <div class="mt-4">
      <Table headers={activeHeaders}>
        {#if currentRows.length === 0}
          <TableEmptyState title={t("notifications.empty")} colspan={activeHeaders.length} />
        {/if}
        {#each currentRows as p (p.id)}
          <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
            {#if columns[0].isVisible}
              <TableCell class="py-4 text-[10px] font-bold tracking-widest text-stone-900 uppercase"
                >{p.channel}</TableCell
              >
            {/if}
            {#if columns[1].isVisible}
              <TableCell class="py-4 text-stone-600">{p.recipient}</TableCell>
            {/if}
            {#if columns[2].isVisible}
              <TableCell class="py-4">
                <div class="flex items-center gap-2">
                  <div
                    class="h-2 w-2 rounded-full {getStatusType(p.status) === 'success'
                      ? 'bg-green-500'
                      : getStatusType(p.status) === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-red-500'} animate-pulse"
                  ></div>
                  <span class="text-[10px] font-black tracking-widest text-stone-700 uppercase">{p.status}</span>
                </div>
              </TableCell>
            {/if}
            {#if columns[3].isVisible}
              <TableCell class="py-4 text-xs text-stone-400">
                {p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}
              </TableCell>
            {/if}
            {#if columns[4].isVisible}
              <TableCell class="py-4 text-xs text-stone-400">
                {p.sentAt ? new Date(p.sentAt).toLocaleString() : "-"}
              </TableCell>
            {/if}
            <TableCell align="center" class="py-4">
              <RowActions
                showEdit={false}
                showSave={false}
                onDelete={() => handleDelete(p.id)}
                isDeleting={processingId === p.id && deleteMutation.isPending}
              >
                <button
                  class="btn-ghost flex items-center gap-1 disabled:opacity-50"
                  disabled={p.status === "sent" || (processingId === p.id && sendMutation.isPending)}
                  onclick={() => handleSend(p.id)}
                >
                  {#if processingId === p.id && sendMutation.isPending}
                    <svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24"
                      ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
                      ></circle><path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path></svg
                    >
                  {/if}
                  {t("common.send")}
                </button>
              </RowActions>
            </TableCell>
          </TableRow>
        {/each}
      </Table>
    </div>
  </div>

  <PaginationNav
    page={filters.page}
    {totalPages}
    prevHref={filters.page > 1 ? filters.buildPageUrl(filters.page - 1) : undefined}
    nextHref={filters.page < totalPages ? filters.buildPageUrl(filters.page + 1) : undefined}
  />

  <ToastNotification bind:this={toastRef} />
</div>
