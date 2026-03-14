<script lang="ts">
  let {
    initialRows = [],
    total: initialTotal = 0,
    q = "",
    status = "",
    page = 1,
    limit = 20,
    lang,
  }: {
    initialRows?: any[];
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
  import AdminHeaderFilters from "@/components/admin/AdminHeaderFilters.svelte";
  import TableEmptyState from "@/components/admin/ui/TableEmptyState.svelte";
  import { createAdminFilters } from "@/lib/admin-filters.svelte";
  import { createAdminMutation } from "@/lib/admin-mutations.svelte";
  import { createTableState } from "@/lib/admin-table-state.svelte";
  import InlineEditableField from "@/components/admin/ui/forms/InlineEditableField.svelte";
  import Fab from "@/components/admin/ui/Fab.svelte";
  import AdminDrawerForm from "@/components/admin/ui/overlay/AdminDrawerForm.svelte";
  import PaginationNav from "@/components/admin/PaginationNav.svelte";
  import { onMount } from "svelte";

  const filters = createAdminFilters({ q: untrack(() => q), status: untrack(() => status), page: untrack(() => page) });
  const localLimit = untrack(() => limit) || 20;

  let columns = $state([
    { id: "name", label: t("common.name"), isVisible: true },
    { id: "phone", label: t("customers.phone"), isVisible: true },
    { id: "email", label: t("common.email"), isVisible: true },
    { id: "notes", label: t("customers.notes"), isVisible: true },
  ]);

  const query = createQuery(() => ({
    queryKey: ["customers", filters.q, filters.page],
    queryFn: () =>
      trpc.customers.list.query({ q: filters.q, limit: localLimit, offset: (filters.page - 1) * localLimit }),
    initialData: filters.isInitial ? { data: initialRows, total: initialTotal } : undefined,
  }));

  const currentRows = $derived(query.data?.data || []);
  const totalPages = $derived(Math.max(1, Math.ceil((query.data?.total || 0) / localLimit)));
  const tableState = createTableState<any>(() => currentRows);

  let toastRef = $state<ToastNotification>();
  let isDrawerOpen = $state(false);
  let processingId = $state<string | null>(null);

  const updateMutation = createAdminMutation(
    (payload: { id: string; data: any }) => trpc.customers.update.mutate(payload),
    {
      invalidateKeys: [["customers"]],
      successMessage: t("customers.toast_update"),
      onSuccess: () => tableState.reset(),
    },
    () => toastRef,
  );

  const deleteMutation = createAdminMutation(
    (id: string) => trpc.customers.delete.mutate(id),
    {
      invalidateKeys: [["customers"]],
      successMessage: t("customers.toast_delete"),
    },
    () => toastRef,
  );

  const createMutation = createAdminMutation(
    (data: any) => trpc.customers.create.mutate(data),
    {
      invalidateKeys: [["customers"]],
      successMessage: t("customers.toast_add"),
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
      phone: String(formData.get("phone")),
      email: (formData.get("email") as string) || null,
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
    if (!confirm(t("customers.confirm_delete"))) return;
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
      <SectionHeader title={t("customers.title_list")} muted={t("customers.badge_crm")} />

      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="customers" q={filters.q} bind:columns {lang} />

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
              ><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line
                x1="19"
                x2="19"
                y1="8"
                y2="14"
              /><line x1="22" x2="16" y1="11" y2="11" /></svg
            >
            {t("customers.add_data")}
          </div>
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("customers.add_data")} />

    {#snippet customerIcon()}
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
        ><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line
          x1="19"
          x2="19"
          y1="8"
          y2="14"
        /><line x1="22" x2="16" y1="11" y2="11" /></svg
      >
    {/snippet}

    <AdminDrawerForm
      bind:isOpen={isDrawerOpen}
      title={t("customers.title_add")}
      subtitle={t("customers.badge_crm")}
      icon={customerIcon}
      isSubmitting={createMutation.isPending}
      onsubmit={handleCreate}
      formId="customer-form"
    >
      <div class="space-y-6">
        <TextInput
          id="name"
          name="name"
          label={t("customers.full_name")}
          required
          placeholder={t("customers.name_placeholder")}
        />
        <div class="grid grid-cols-2 gap-4">
          <TextInput
            id="phone"
            name="phone"
            label={t("customers.phone")}
            required
            placeholder={t("customers.phone_placeholder")}
          />
          <TextInput
            id="email"
            name="email"
            type="email"
            label={t("customers.email_optional")}
            placeholder={t("customers.email_placeholder")}
          />
        </div>
        <TextInput
          id="notes"
          name="notes"
          label={t("customers.notes")}
          placeholder={t("customers.notes_placeholder")}
        />
      </div>
    </AdminDrawerForm>

    <Table headers={activeHeaders}>
      {#if currentRows.length === 0}
        <TableEmptyState title={t("customers.empty")} colspan={activeHeaders.length} />
      {/if}
      {#each currentRows as row (row.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          {#if columns[0].isVisible}
            <TableCell class="py-4 font-bold text-stone-900">
              <InlineEditableField
                value={row.name}
                oninput={(e: any) => tableState.onEdit(row.id, "name", e.currentTarget.innerText)}
                field="name"
              />
            </TableCell>
          {/if}
          {#if columns[1].isVisible}
            <TableCell class="py-4 font-mono font-bold text-[#c48a3a]">
              <InlineEditableField
                value={row.phone}
                oninput={(e: any) => tableState.onEdit(row.id, "phone", e.currentTarget.innerText)}
                field="phone"
              />
            </TableCell>
          {/if}
          {#if columns[2].isVisible}
            <TableCell class="py-4 text-stone-600">
              <InlineEditableField
                value={row.email || "-"}
                oninput={(e: any) => tableState.onEdit(row.id, "email", e.currentTarget.innerText)}
                field="email"
              />
            </TableCell>
          {/if}
          {#if columns[3].isVisible}
            <TableCell class="py-4 text-sm text-stone-500 italic">
              <InlineEditableField
                value={row.notes || "-"}
                oninput={(e: any) => tableState.onEdit(row.id, "notes", e.currentTarget.innerText)}
                field="notes"
              />
            </TableCell>
          {/if}
          <TableCell align="center" class="py-4">
            <RowActions
              detailHref={`/admin/customers/${row.id}`}
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
