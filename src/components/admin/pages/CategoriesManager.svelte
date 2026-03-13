<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { onMount, untrack } from "svelte";
  import { fly } from "svelte/transition";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import type { Category } from "../../../lib/types";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import InlineEditableField from "../ui/forms/InlineEditableField.svelte";
  import Button from "../ui/Button.svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import Fab from "../ui/Fab.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import Drawer from "../ui/overlay/Drawer.svelte";
  import { createAdminFilters } from "../../../lib/admin-filters.svelte";
  import AdminDrawerForm from "../ui/overlay/AdminDrawerForm.svelte";
  import { createAdminMutation } from "../../../lib/admin-mutations.svelte";
  import { createTableState } from "../../../lib/admin-table-state.svelte";
  import PaginationNav from "../PaginationNav.svelte";

  let columns = $state([
    { id: "kategori", label: t("catalog.categories.name"), isVisible: true, class: "" },
    { id: "slug", label: t("catalog.categories.slug"), isVisible: true, class: "hidden lg:table-cell" },
    { id: "urut", label: t("catalog.categories.sort_order"), isVisible: true, class: "" },
    { id: "status", label: t("common.status"), isVisible: true, class: "" },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label, class: c.class })),
    t("common.actions"),
  ]);

  type CategoryMutationInput = {
    name: string;
    slug: string;
    isActive: number;
    sortOrder?: number;
  };
  let {
    rows: initialRows = [],
    total: initialTotal = 0,
    q = "",
    status = "",
    page = 1,
    limit = 30,
    lang,
  }: {
    rows?: Category[];
    total?: number;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();

  initI18n(untrack(() => lang));

  const filters = createAdminFilters({ q, status, page });
  const localLimit = untrack(() => limit) || 20;

  const queryClient = useQueryClient();
  let toastRef = $state<ToastNotification>();
  let newName = $state("");
  let newSlug = $state("");
  let processingId = $state<string | null>(null);
  let isDrawerOpen = $state(false);

  // Update table state when query data changes

  const updateMutation = createAdminMutation(
    (input: { id: string; data: Partial<Category> }) => trpc.categories.update.mutate(input),
    {
      invalidateKeys: [["categories.list"]],
      successMessage: t("catalog.categories.toast_update"),
      onSuccess: () => {
        if (processingId) tableState.clearChanges(processingId);
      },
    },
    () => toastRef,
  );

  const deleteMutation = createAdminMutation(
    (id: string) => trpc.categories.delete.mutate(id),
    {
      invalidateKeys: [["categories.list"]],
      successMessage: t("catalog.categories.toast_delete"),
    },
    () => toastRef,
  );

  const categoryFormMutation = createAdminMutation(
    (payload: CategoryMutationInput) => trpc.categories.create.mutate(payload),
    {
      invalidateKeys: [["categories.list"]],
      successMessage: t("catalog.categories.toast_add"),
      onSuccess: () => {
        newName = "";
        newSlug = "";
        isDrawerOpen = false;
      },
    },
    () => toastRef,
  );

  let isSubmitting = $derived(categoryFormMutation.isPending);

  const categoriesQuery = createQuery(() => ({
    queryKey: ["categories.list", { q: filters.q, status: filters.status, limit: localLimit, page: filters.page }],
    queryFn: () =>
      trpc.categories.list.query({
        q: filters.q,
        status: filters.status as "active" | "inactive" | undefined,
        limit: localLimit,
        page: filters.page,
      }),
    initialData: filters.isInitial ? { data: initialRows, total: initialTotal } : undefined,
    placeholderData: (prev) => prev,
  }));

  let categories = $derived((categoriesQuery.data?.data as Category[]) || initialRows);
  const tableState = createTableState<Category>(() => categories);
  const totalPages = $derived(Math.max(1, Math.ceil((categoriesQuery.data?.total || 0) / limit)));

  // Update table state when query data changes

  $effect(() => {
    if (newName) {
      newSlug = newName
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
    }
  });

  const categoryFormHandler = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const payload: CategoryMutationInput = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      sortOrder: Number(formData.get("sort_order") || 0),
      isActive: formData.get("isActive") === "true" ? 1 : 0,
    };

    try {
      await categoryFormMutation.mutate(payload);
      form.reset();
    } catch (e) {}
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
    if (!confirm(t("catalog.categories.confirm_delete"))) return;
    processingId = id;
    try {
      await deleteMutation.mutate(id);
    } finally {
      processingId = null;
    }
  };
</script>

<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
  <div class="mt-2 mb-8 flex items-center justify-between">
    <SectionHeader title={t("catalog.categories.title")} muted={t("catalog.categories.subtitle")} />
    <div class="hidden lg:flex lg:items-center lg:gap-3">
      <AdminHeaderFilters tab="categories" q={filters.q} status={filters.status} bind:columns {lang} />
      <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex items-center gap-2">
        <div
          class="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:rotate-90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
          >
        </div>
        {t("catalog.categories.add")}
      </Button>
    </div>
  </div>

  <Fab onclick={() => (isDrawerOpen = true)} label={t("catalog.categories.add")} />

  {#snippet categoryIcon()}
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
      ><path d="m7.5 4.27 9 5.15" /><path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
      /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg
    >
  {/snippet}

  <AdminDrawerForm
    bind:isOpen={isDrawerOpen}
    title={t("catalog.categories.add")}
    subtitle={t("catalog.categories.subtitle")}
    icon={categoryIcon}
    {isSubmitting}
    onsubmit={categoryFormHandler}
    formId="category-form"
    saveLabel={t("catalog.categories.add")}
  >
    <div class="space-y-1.5">
      <div class="mb-1 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-stone-400"
          ><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" /><path
            d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"
          /></svg
        >
        <label for="name" class="text-[0.8rem] font-bold text-stone-600">{t("catalog.categories.name")}</label>
      </div>
      <TextInput
        name="name"
        id="name"
        required
        bind:value={newName}
        placeholder={t("catalog.categories.name_placeholder")}
        class="ring-stone-100/50"
      />
      <p class="mt-1 px-1 text-[0.65rem] font-medium text-stone-400 italic">
        {t("catalog.categories.name_help")}
      </p>
    </div>

    <div class="space-y-1.5">
      <div class="mb-1 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-stone-400"
          ><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path
            d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
          /></svg
        >
        <label for="slug" class="text-[0.8rem] font-bold text-stone-600">{t("catalog.categories.slug")}</label>
      </div>
      <TextInput
        name="slug"
        id="slug"
        bind:value={newSlug}
        placeholder={t("catalog.categories.slug_placeholder")}
        class="bg-stone-50/50 font-mono text-[0.85rem] ring-stone-100/50"
      />
    </div>

    <div class="flex gap-4">
      <div class="flex-1 space-y-1.5">
        <div class="mb-1 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-stone-400"
            ><path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" /></svg
          >
          <label for="sort_order" class="text-[0.8rem] font-bold text-stone-600"
            >{t("catalog.categories.sort_order")}</label
          >
        </div>
        <TextInput
          name="sort_order"
          id="sort_order"
          type="number"
          value={0}
          placeholder="0-99"
          class="text-center tabular-nums ring-stone-100/50"
        />
      </div>
      <div class="flex-[2] space-y-1.5">
        <div class="mb-1 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-stone-400"
            ><path
              d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"
            /><circle cx="12" cy="12" r="3" /></svg
          >
          <label for="isActive" class="text-[0.8rem] font-bold text-stone-600"
            >{t("catalog.categories.visibility")}</label
          >
        </div>
        <SelectInput
          name="isActive"
          id="isActive"
          placeholder={t("catalog.categories.select_status")}
          options={[
            { label: t("catalog.categories.active"), value: "true" },
            { label: t("catalog.categories.draft"), value: "false" },
          ]}
          class="ring-stone-100/50"
        />
      </div>
    </div>

    <div class="rounded-2xl border border-[#c48a3a]/10 bg-[#c48a3a]/5 p-5 text-[#865d25]">
      <div class="flex gap-3">
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
          class="mt-1 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg
        >
        <div>
          <h4 class="text-[0.75rem] font-black tracking-wider uppercase">{t("catalog.categories.tips_title")}</h4>
          <p class="mt-1 text-[0.8rem] leading-relaxed font-medium">
            {@html t("catalog.categories.tips_desc").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}
          </p>
        </div>
      </div>
    </div>
  </AdminDrawerForm>

  <Table headers={activeHeaders}>
    {#if categories.length === 0}
      <TableEmptyState
        title={t("catalog.categories.empty")}
        subtitle={t("catalog.categories.empty_desc")}
        colspan={activeHeaders.length}
      />
    {/if}
    {#each categories as row (row.id)}
      <TableRow
        data-id={row.id}
        class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50"
      >
        {#if columns[0].isVisible}
          <TableCell class="py-4">
            <div class="flex flex-col gap-1">
              <InlineEditableField
                value={row.name}
                oninput={(e: any) => tableState.onEdit(row.id, "name", e.currentTarget.innerText)}
                field="name"
                ariaLabel={t("catalog.categories.name")}
                class="min-w-[120px]"
              />
              <div class="font-mono text-[0.65rem] text-stone-400 lg:hidden">/{row.slug}</div>
            </div>
          </TableCell>
        {/if}
        {#if columns[1].isVisible}
          <TableCell class="hidden py-4 lg:table-cell">
            <InlineEditableField
              value={row.slug || ""}
              oninput={(e: any) => tableState.onEdit(row.id, "slug", e.currentTarget.innerText)}
              field="slug"
              ariaLabel={t("catalog.categories.slug")}
              class="min-w-[120px] font-mono text-[0.8rem] font-normal text-stone-500"
            />
          </TableCell>
        {/if}
        {#if columns[2].isVisible}
          <TableCell class="py-4">
            <InlineEditableField
              value={row.sortOrder}
              oninput={(e: any) => tableState.onEdit(row.id, "sortOrder", Number(e.currentTarget.innerText))}
              field="sortOrder"
              ariaLabel={t("catalog.categories.sort_order")}
              class="w-16 text-center text-stone-600 tabular-nums"
            />
          </TableCell>
        {/if}
        {#if columns[3].isVisible}
          <TableCell class="py-4">
            <select
              data-field="isActive"
              onchange={(e) => tableState.onEdit(row.id, "isActive", e.currentTarget.value === "true" ? 1 : 0)}
              class="cursor-pointer rounded-lg border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 text-[0.7rem] font-bold tracking-wider text-stone-700 uppercase transition-all outline-none hover:border-[#c48a3a]/30 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
            >
              <option value="true" selected={row.isActive === 1}>{t("catalog.categories.active")}</option>
              <option value="false" selected={row.isActive === 0}>{t("catalog.categories.draft")}</option>
            </select>
          </TableCell>
        {/if}
        <TableCell align="center" class="py-4">
          <div class="flex items-center justify-center">
            <RowActions
              showSave={tableState.hasChanges(row.id)}
              isSaving={processingId === row.id && updateMutation.isPending}
              isDeleting={processingId === row.id && deleteMutation.isPending}
              onSave={() => handleSave(row.id)}
              onDelete={() => handleDelete(row.id)}
            />
          </div>
        </TableCell>
      </TableRow>
    {/each}
  </Table>

  <PaginationNav
    page={filters.page}
    {totalPages}
    prevHref={filters.page > 1 ? filters.buildPageUrl(filters.page - 1) : undefined}
    nextHref={filters.page < totalPages ? filters.buildPageUrl(filters.page + 1) : undefined}
  />
  <ToastNotification bind:this={toastRef} />
</div>
