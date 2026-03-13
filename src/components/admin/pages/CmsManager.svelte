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
    rows?: any[];
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
  import { untrack } from "svelte";
  import { fly } from "svelte/transition";
  import SectionHeader from "../SectionHeader.svelte";
  import RowActions from "../RowActions.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import Textarea from "../ui/forms/Textarea.svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import Fab from "../ui/Fab.svelte";
  import AdminDrawerForm from "../ui/overlay/AdminDrawerForm.svelte";
  import { createAdminFilters } from "../../../lib/admin-filters.svelte";
  import { createAdminMutation } from "../../../lib/admin-mutations.svelte";
  import { createTableState } from "../../../lib/admin-table-state.svelte";
  import InlineEditableField from "../ui/forms/InlineEditableField.svelte";
  import PaginationNav from "../PaginationNav.svelte";
  import { onMount } from "svelte";

  let columns = $state([
    { id: "title", label: t("cms.label_title"), isVisible: true },
    { id: "slug", label: t("cms.label_slug"), isVisible: true },
    { id: "status", label: t("cms.label_status"), isVisible: true },
    { id: "updatedAt", label: t("cms.label_updated_at"), isVisible: true },
  ]);

  const filters = createAdminFilters({ q, status, page });
  const localLimit = untrack(() => limit) || 30;

  let toastRef = $state<ToastNotification>();
  let isDrawerOpen = $state(false);
  let processingId = $state<string | null>(null);

  const query = createQuery(() => ({
    queryKey: ["cms", filters.q, filters.status, filters.page],
    queryFn: () =>
      trpc.cms.list.query({
        q: filters.q,
        status: filters.status,
        page: filters.page,
        limit: localLimit,
      }),
    initialData: filters.isInitial ? { rows: initialRows, total: total || 0 } : undefined,
  }));

  const currentRows = $derived(query.data?.rows || []);
  const totalPages = $derived(Math.max(1, Math.ceil((query.data?.total || 0) / localLimit)));
  const tableState = createTableState<any>(() => currentRows);

  const updateMutation = createAdminMutation(
    (payload: { id: string; data: any }) => trpc.cms.update.mutate(payload),
    {
      invalidateKeys: [["cms"]],
      successMessage: t("cms.toast_update"),
      onSuccess: () => tableState.reset(),
    },
    () => toastRef,
  );

  const deleteMutation = createAdminMutation(
    (id: string) => trpc.cms.delete.mutate(id),
    {
      invalidateKeys: [["cms"]],
      successMessage: t("cms.toast_delete"),
    },
    () => toastRef,
  );

  const createMutation = createAdminMutation(
    (data: any) => trpc.cms.create.mutate(data),
    {
      invalidateKeys: [["cms"]],
      successMessage: t("cms.toast_add"),
      onSuccess: () => {
        isDrawerOpen = false;
      },
    },
    () => toastRef,
  );

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const data = {
      title: String(formData.get("title")),
      slug: String(formData.get("slug")),
      contentMd: String(formData.get("contentMd")),
      isActive: formData.get("isActive") === "true" ? 1 : 0,
    };
    await createMutation.mutate(data);
  };

  const handleSave = async (id: string) => {
    const updates = tableState.editedValues[id];
    if (!updates) return;
    processingId = id;
    try {
      await updateMutation.mutate({ id, data: updates });
    } finally {
      processingId = null;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("catalog.products.confirm_delete"))) return;
    processingId = id;
    try {
      await deleteMutation.mutate(id);
    } finally {
      processingId = null;
    }
  };

  const activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("cms.title_list")} muted={t("cms.empty_list")} />

      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="cms" q={filters.q} status={filters.status} bind:columns {lang} />

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
            ><rect width="18" height="13" x="3" y="5" rx="2" /><path d="M7 5V3" /><path d="M11 5V3" /><path
              d="M15 5V3"
            /><path d="M19 5V3" /><path d="M3 13h18" /></svg
          >
          {t("cms.button_new")}
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("cms.button_new")} />

    {#snippet cmsIcon()}
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
        ><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h10" /><path d="M7 12h10" /><path
          d="M7 17h6"
        /></svg
      >
    {/snippet}

    <AdminDrawerForm
      bind:isOpen={isDrawerOpen}
      title={t("cms.title_create")}
      subtitle={t("cms.empty_list")}
      icon={cmsIcon}
      isSubmitting={createMutation.isPending}
      onsubmit={handleCreate}
      formId="cms-form"
    >
      <div class="space-y-6">
        <TextInput id="title" name="title" label={t("cms.label_title")} required placeholder="Page Title" />
        <TextInput id="slug" name="slug" label={t("cms.label_slug")} required placeholder="page-slug" />
        <Textarea
          id="contentMd"
          name="contentMd"
          label={t("cms.label_content")}
          rows={10}
          placeholder="Markdown content..."
        />
        <SelectInput id="isActive" name="isActive" label={t("cms.label_status")}>
          <option value="true">{t("common.active")}</option>
          <option value="false">{t("common.inactive")}</option>
        </SelectInput>
      </div>
    </AdminDrawerForm>

    <Table headers={activeHeaders}>
      {#if currentRows.length === 0}
        <TableEmptyState title={t("cms.empty")} colspan={activeHeaders.length} />
      {/if}
      {#each currentRows as row (row.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          {#if columns[0].isVisible}
            <TableCell class="py-4 font-bold text-stone-900">
              <InlineEditableField
                value={row.title}
                oninput={(e: any) => tableState.onEdit(row.id, "title", e.currentTarget.innerText)}
                field="title"
              />
            </TableCell>
          {/if}
          {#if columns[1].isVisible}
            <TableCell class="py-4 font-mono text-sm text-stone-500">
              <InlineEditableField
                value={row.slug}
                oninput={(e: any) => tableState.onEdit(row.id, "slug", e.currentTarget.innerText)}
                field="slug"
              />
            </TableCell>
          {/if}
          {#if columns[2].isVisible}
            <TableCell class="py-4">
              <select
                onchange={(e) => tableState.onEdit(row.id, "isActive", e.currentTarget.value === "true" ? 1 : 0)}
                class="rounded-lg border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-bold uppercase"
              >
                <option value="true" selected={(tableState.editedValues[row.id]?.isActive ?? row.isActive) === 1}
                  >{t("common.active")}</option
                >
                <option value="false" selected={(tableState.editedValues[row.id]?.isActive ?? row.isActive) === 0}
                  >{t("common.inactive")}</option
                >
              </select>
            </TableCell>
          {/if}
          {#if columns[3].isVisible}
            <TableCell class="py-4 text-stone-400 tabular-nums">
              {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "-"}
            </TableCell>
          {/if}
          <TableCell align="center" class="py-4">
            <RowActions
              onSave={() => handleSave(row.id)}
              onDelete={() => handleDelete(row.id)}
              isSaving={processingId === row.id && updateMutation.isPending}
              isDeleting={processingId === row.id && deleteMutation.isPending}
            />
          </TableCell>
        </TableRow>
      {/each}
    </Table>
  </div>

  <PaginationNav
    page={filters.page}
    {totalPages}
    prevHref={filters.page > 1 ? filters.buildPageUrl(filters.page - 1) : undefined}
    nextHref={filters.page < totalPages ? filters.buildPageUrl(filters.page + 1) : undefined}
  />

  <ToastNotification bind:this={toastRef} />
</div>
