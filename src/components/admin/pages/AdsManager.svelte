<script lang="ts">
  let {
    rows: initialRows = [],
    total: initialTotal = 0,
    q = "",
    status = "",
    page = 1,
    limit = 20,
    lang,
  }: {
    rows: any[];
    total?: number;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();
  initI18n(untrack(() => lang));

  import { trpc } from "@/lib/trpc";
  import { createQuery } from "@tanstack/svelte-query";
  import { fly } from "svelte/transition";
  import { t, initI18n } from "@/lib/i18n/store.svelte";
  import { untrack } from "svelte";
  import RowActions from "@/components/admin/RowActions.svelte";
  import SectionHeader from "@/components/admin/SectionHeader.svelte";
  import ToastNotification from "@/components/admin/ToastNotification.svelte";
  import Table from "@/components/admin/ui/Table.svelte";
  import TableRow from "@/components/admin/ui/TableRow.svelte";
  import TableCell from "@/components/admin/ui/TableCell.svelte";
  import Button from "@/components/admin/ui/Button.svelte";
  import TextInput from "@/components/admin/ui/forms/TextInput.svelte";
  import SelectInput from "@/components/admin/ui/forms/SelectInput.svelte";
  import Textarea from "@/components/admin/ui/forms/Textarea.svelte";
  import AdminHeaderFilters from "@/components/admin/AdminHeaderFilters.svelte";
  import TableEmptyState from "@/components/admin/ui/TableEmptyState.svelte";
  import Fab from "@/components/admin/ui/Fab.svelte";
  import AdminDrawerForm from "@/components/admin/ui/overlay/AdminDrawerForm.svelte";
  import { createAdminFilters } from "@/lib/admin-filters.svelte";
  import { createAdminMutation } from "@/lib/admin-mutations.svelte";
  import { createTableState } from "@/lib/admin-table-state.svelte";
  import InlineEditableField from "@/components/admin/ui/forms/InlineEditableField.svelte";
  import PaginationNav from "@/components/admin/PaginationNav.svelte";
  import { onMount } from "svelte";

  const filters = createAdminFilters({ q: untrack(() => q), status: untrack(() => status), page: untrack(() => page) });
  const localLimit = untrack(() => limit) || 20;

  let columns = $state([
    { id: "name", label: t("common.name"), isVisible: true },
    { id: "channel", label: t("ads.channel"), isVisible: true },
    { id: "budget", label: t("ads.budget"), isVisible: true },
    { id: "spend", label: t("ads.spend"), isVisible: true },
    { id: "status", label: t("common.status"), isVisible: true },
  ]);

  const query = createQuery(() => ({
    queryKey: ["ads", filters.q, filters.status, filters.page],
    queryFn: () =>
      trpc.ads.list.query({
        q: filters.q,
        status: filters.status,
        limit: localLimit,
        offset: (filters.page - 1) * localLimit,
      }),
    initialData: filters.isInitial ? { data: initialRows, total: initialTotal } : undefined,
  }));

  const currentRows = $derived(query.data?.data || []);
  const totalPages = $derived(Math.max(1, Math.ceil((query.data?.total || 0) / localLimit)));
  const tableState = createTableState<any>(() => currentRows);

  let toastRef = $state<ToastNotification>();
  let isDrawerOpen = $state(false);
  let processingId = $state<string | null>(null);

  const updateMutation = createAdminMutation(
    (payload: { id: string; data: any }) => trpc.ads.update.mutate(payload),
    {
      invalidateKeys: [["ads"]],
      successMessage: t("ads.toast_update"),
      onSuccess: () => tableState.reset(),
    },
    () => toastRef,
  );

  const deleteMutation = createAdminMutation(
    (id: string) => trpc.ads.delete.mutate(id),
    {
      invalidateKeys: [["ads"]],
      successMessage: t("ads.toast_delete"),
    },
    () => toastRef,
  );

  const createMutation = createAdminMutation(
    (data: any) => trpc.ads.create.mutate(data),
    {
      invalidateKeys: [["ads"]],
      successMessage: t("ads.toast_add"),
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
      name: String(formData.get("name")),
      channel: String(formData.get("channel")),
      budget: Number(formData.get("budget")),
      spend: Number(formData.get("spend") || 0),
      status: String(formData.get("status")),
      startAt: (formData.get("start_at") as string) || null,
      endAt: (formData.get("end_at") as string) || null,
      notes: (formData.get("notes") as string) || null,
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
    if (!confirm(t("catalog.products.confirm_delete"))) return; // Reuse common translation if available
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
      <SectionHeader title={t("ads.title_list")} muted={t("ads.empty_description")} />

      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="ads" q={filters.q} status={filters.status} bind:columns {lang} />

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
              stroke-linejoin="round"
              ><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M12 8v8" /><path d="M8 12h8" /></svg
            >
            {t("ads.title_create")}
          </div>
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("ads.title_create")} />

    {#snippet adIcon()}
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
        ><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg
      >
    {/snippet}

    <AdminDrawerForm
      bind:isOpen={isDrawerOpen}
      title={t("ads.title_create")}
      subtitle={t("ads.empty_description")}
      icon={adIcon}
      isSubmitting={createMutation.isPending}
      onsubmit={handleCreate}
      formId="ad-form"
    >
      <div class="space-y-6">
        <TextInput id="name" name="name" label={t("common.name")} required placeholder="Campaign Name" />

        <div class="grid grid-cols-2 gap-4">
          <SelectInput id="channel" name="channel" label={t("ads.channel")} required>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="google">Google</option>
            <option value="tiktok">TikTok</option>
            <option value="other">Other</option>
          </SelectInput>
          <SelectInput id="status" name="status" label={t("common.status")} required>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </SelectInput>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <TextInput id="budget" name="budget" label={t("ads.budget")} type="number" required placeholder="0" />
          <TextInput id="spend" name="spend" label={t("ads.spend")} type="number" placeholder="0" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <TextInput id="start_at" name="start_at" label={t("ads.start_date")} type="date" />
          <TextInput id="end_at" name="end_at" label={t("ads.end_date")} type="date" />
        </div>

        <Textarea id="notes" name="notes" label={t("customers.notes")} rows={3} />
      </div>
    </AdminDrawerForm>

    <Table headers={activeHeaders}>
      {#if currentRows.length === 0}
        <TableEmptyState title={t("ads.empty")} colspan={activeHeaders.length} />
      {/if}
      {#each currentRows as row (row.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          {#if columns[0].isVisible}
            <TableCell class="py-4">
              <InlineEditableField
                value={row.name}
                oninput={(e: any) => tableState.onEdit(row.id, "name", e.currentTarget.innerText)}
                field="name"
                class="font-bold text-stone-900"
              />
            </TableCell>
          {/if}
          {#if columns[1].isVisible}
            <TableCell class="py-4">
              <select
                onchange={(e) => tableState.onEdit(row.id, "channel", e.currentTarget.value)}
                class="rounded-lg border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-bold uppercase"
              >
                <option
                  value="facebook"
                  selected={(tableState.editedValues[row.id]?.channel ?? row.channel) === "facebook"}>Facebook</option
                >
                <option
                  value="instagram"
                  selected={(tableState.editedValues[row.id]?.channel ?? row.channel) === "instagram"}>Instagram</option
                >
                <option value="google" selected={(tableState.editedValues[row.id]?.channel ?? row.channel) === "google"}
                  >Google</option
                >
                <option value="tiktok" selected={(tableState.editedValues[row.id]?.channel ?? row.channel) === "tiktok"}
                  >TikTok</option
                >
                <option value="other" selected={(tableState.editedValues[row.id]?.channel ?? row.channel) === "other"}
                  >Other</option
                >
              </select>
            </TableCell>
          {/if}
          {#if columns[2].isVisible}
            <TableCell class="py-4 font-bold text-stone-800 tabular-nums">
              <InlineEditableField
                value={row.budget}
                oninput={(e: any) => tableState.onEdit(row.id, "budget", Number(e.currentTarget.innerText))}
                field="budget"
                type="number"
              />
            </TableCell>
          {/if}
          {#if columns[3].isVisible}
            <TableCell class="py-4 font-bold text-rose-600 tabular-nums">
              <InlineEditableField
                value={row.spend}
                oninput={(e: any) => tableState.onEdit(row.id, "spend", Number(e.currentTarget.innerText))}
                field="spend"
                type="number"
              />
            </TableCell>
          {/if}
          {#if columns[4].isVisible}
            <TableCell class="py-4">
              <select
                onchange={(e) => tableState.onEdit(row.id, "status", e.currentTarget.value)}
                class="rounded-lg border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-bold uppercase transition-colors"
              >
                <option value="draft" selected={(tableState.editedValues[row.id]?.status ?? row.status) === "draft"}
                  >Draft</option
                >
                <option value="active" selected={(tableState.editedValues[row.id]?.status ?? row.status) === "active"}
                  >Active</option
                >
                <option value="paused" selected={(tableState.editedValues[row.id]?.status ?? row.status) === "paused"}
                  >Paused</option
                >
                <option
                  value="completed"
                  selected={(tableState.editedValues[row.id]?.status ?? row.status) === "completed"}>Completed</option
                >
              </select>
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
