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
    rows: Coupon[];
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
  import { fly } from "svelte/transition";
  import type { Coupon } from "../../../lib/types";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import { untrack } from "svelte";
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
    { id: "code", label: t("coupons.code"), isVisible: true },
    { id: "type", label: t("coupons.type"), isVisible: true },
    { id: "value", label: t("coupons.value"), isVisible: true },
    { id: "min_order", label: t("coupons.min_order"), isVisible: true },
    { id: "start_date", label: t("coupons.start_date"), isVisible: false },
    { id: "end_date", label: t("coupons.end_date"), isVisible: true },
    { id: "limit", label: t("coupons.total_quota"), isVisible: true },
    { id: "status", label: t("coupons.status"), isVisible: true },
  ]);

  const filters = createAdminFilters({ q, status, page });
  let toastRef = $state<ToastNotification>();
  let isDrawerOpen = $state(false);
  let processingId = $state<string | null>(null);

  const query = createQuery(() => ({
    queryKey: ["coupons", filters.q, filters.status, filters.page],
    queryFn: () =>
      trpc.coupons.list.query({
        q: filters.q,
        status: filters.status,
        limit,
        offset: (filters.page - 1) * limit,
      }),
    initialData: filters.isInitial ? { data: initialRows, total: initialTotal } : undefined,
  }));

  const currentRows = $derived(query.data?.data || []);
  const totalPages = $derived(Math.max(1, Math.ceil((query.data?.total || 0) / limit)));
  const tableState = createTableState<Coupon>(() => currentRows);

  const updateMutation = createAdminMutation(
    (payload: { id: string; data: any }) => trpc.coupons.update.mutate(payload),
    {
      invalidateKeys: [["coupons"]],
      successMessage: t("coupons.toast_update"),
      onSuccess: () => tableState.reset(),
    },
    () => toastRef,
  );

  const deleteMutation = createAdminMutation(
    (id: string) => trpc.coupons.delete.mutate(id),
    {
      invalidateKeys: [["coupons"]],
      successMessage: t("coupons.toast_delete"),
    },
    () => toastRef,
  );

  const createMutation = createAdminMutation(
    (data: any) => trpc.coupons.create.mutate(data),
    {
      invalidateKeys: [["coupons"]],
      successMessage: t("coupons.toast_add"),
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
      code: String(formData.get("code")).toUpperCase(),
      type: String(formData.get("type")),
      value: Number(formData.get("value")),
      minOrder: formData.get("min_order") ? Number(formData.get("min_order")) : null,
      maxDiscount: formData.get("max_discount") ? Number(formData.get("max_discount")) : null,
      startAt: (formData.get("start_at") as string) || null,
      endAt: (formData.get("end_at") as string) || null,
      usageLimit: formData.get("usage_limit") ? Number(formData.get("usage_limit")) : null,
      perUserLimit: formData.get("per_user_limit") ? Number(formData.get("per_user_limit")) : 1,
      isActive: formData.get("is_active") === "true" ? 1 : 0,
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
    if (!confirm(t("coupons.confirm_delete"))) return;
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
      <SectionHeader title={t("coupons.title_list")} muted={t("coupons.badge_promo")} />

      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="coupons" q={filters.q} status={filters.status} bind:columns {lang} />

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
            {t("coupons.add_coupon")}
          </div>
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("coupons.add_coupon")} />

    {#snippet couponIcon()}
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
        ><path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" /><path d="M21 12H3" /><path
          d="M21 16v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2"
        /><rect width="18" height="8" x="3" y="8" rx="2" /></svg
      >
    {/snippet}

    <AdminDrawerForm
      bind:isOpen={isDrawerOpen}
      title={t("coupons.title_add")}
      subtitle={t("coupons.badge_promo")}
      icon={couponIcon}
      isSubmitting={createMutation.isPending}
      onsubmit={handleCreate}
      formId="coupon-form"
    >
      <div class="space-y-6">
        <div class="space-y-4">
          <h4 class="border-b border-[#c48a3a]/20 pb-2 text-[10px] font-black tracking-widest text-[#c48a3a] uppercase">
            {t("coupons.basic_info")}
          </h4>
          <TextInput
            id="code"
            name="code"
            label={t("coupons.code")}
            required
            placeholder={t("coupons.code_placeholder")}
            class="font-bold uppercase"
          />
          <div class="grid grid-cols-2 gap-4">
            <SelectInput id="type" name="type" label={t("coupons.type")} required>
              <option value="percent">{t("coupons.type_percent")}</option>
              <option value="fixed">{t("coupons.type_fixed")}</option>
              <option value="free_shipping">{t("coupons.type_free_shipping")}</option>
            </SelectInput>
            <TextInput id="value" name="value" label={t("coupons.value")} type="number" required placeholder="0" />
          </div>
        </div>

        <div class="space-y-4">
          <h4 class="border-b border-[#c48a3a]/20 pb-2 text-[10px] font-black tracking-widest text-[#c48a3a] uppercase">
            {t("coupons.limitations")}
          </h4>
          <div class="grid grid-cols-2 gap-4">
            <TextInput id="min_order" name="min_order" label={t("coupons.min_order")} type="number" placeholder="0" />
            <TextInput
              id="max_discount"
              name="max_discount"
              label={t("coupons.max_discount")}
              type="number"
              placeholder={t("coupons.max_discount_no_limit")}
            />
            <TextInput
              id="usage_limit"
              name="usage_limit"
              label={t("coupons.total_quota")}
              type="number"
              placeholder="0"
            />
            <TextInput
              id="per_user_limit"
              name="per_user_limit"
              label={t("coupons.per_user_quota")}
              type="number"
              placeholder="1"
            />
          </div>
        </div>

        <div class="space-y-4">
          <h4 class="border-b border-[#c48a3a]/20 pb-2 text-[10px] font-black tracking-widest text-[#c48a3a] uppercase">
            {t("ads.scheduling")}
          </h4>
          <div class="grid grid-cols-2 gap-4">
            <TextInput id="start_at" name="start_at" label={t("coupons.start_date")} type="date" />
            <TextInput id="end_at" name="end_at" label={t("coupons.end_date")} type="date" />
          </div>
          <SelectInput id="is_active" name="is_active" label={t("coupons.status")}>
            <option value="true">{t("coupons.active")}</option>
            <option value="false">{t("coupons.inactive")}</option>
          </SelectInput>
        </div>
      </div>
    </AdminDrawerForm>

    <div class="mt-2">
      <Table headers={activeHeaders}>
        {#if currentRows.length === 0}
          <TableEmptyState
            title={t("coupons.empty")}
            subtitle={t("coupons.empty_description")}
            colspan={activeHeaders.length}
          />
        {/if}
        {#each currentRows as p (p.id)}
          <TableRow
            data-id={p.id}
            class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50"
          >
            {#if columns[0].isVisible}
              <TableCell class="py-4 font-bold tracking-widest text-stone-900 uppercase">
                <InlineEditableField
                  value={p.code}
                  oninput={(e: any) => tableState.onEdit(p.id, "code", e.currentTarget.innerText.toUpperCase())}
                  field="code"
                />
              </TableCell>
            {/if}
            {#if columns[1].isVisible}
              <TableCell class="py-4">
                <select
                  onchange={(e) => tableState.onEdit(p.id, "type", e.currentTarget.value)}
                  class="rounded-lg border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-bold uppercase"
                >
                  <option value="percent" selected={(tableState.editedValues[p.id]?.type ?? p.type) === "percent"}
                    >{t("coupons.type_percent")}</option
                  >
                  <option value="fixed" selected={(tableState.editedValues[p.id]?.type ?? p.type) === "fixed"}
                    >{t("coupons.type_fixed")}</option
                  >
                  <option
                    value="free_shipping"
                    selected={(tableState.editedValues[p.id]?.type ?? p.type) === "free_shipping"}
                    >{t("coupons.type_free_shipping")}</option
                  >
                </select>
              </TableCell>
            {/if}
            {#if columns[2].isVisible}
              <TableCell class="py-4 tabular-nums">
                <InlineEditableField
                  value={p.value}
                  oninput={(e: any) => tableState.onEdit(p.id, "value", Number(e.currentTarget.innerText))}
                  field="value"
                  type="number"
                />
              </TableCell>
            {/if}
            {#if columns[3].isVisible}
              <TableCell class="py-4 text-stone-500 tabular-nums">
                <InlineEditableField
                  value={p.minOrder ?? 0}
                  oninput={(e: any) => tableState.onEdit(p.id, "minOrder", Number(e.currentTarget.innerText))}
                  field="minOrder"
                  type="number"
                />
              </TableCell>
            {/if}
            {#if columns[4].isVisible}
              <TableCell class="py-4 font-mono text-stone-400">
                <InlineEditableField
                  value={p.startAt || "-"}
                  oninput={(e: any) => tableState.onEdit(p.id, "startAt", e.currentTarget.innerText)}
                  field="startAt"
                />
              </TableCell>
            {/if}
            {#if columns[5].isVisible}
              <TableCell class="py-4 font-mono text-stone-400">
                <InlineEditableField
                  value={p.endAt || "-"}
                  oninput={(e: any) => tableState.onEdit(p.id, "endAt", e.currentTarget.innerText)}
                  field="endAt"
                />
              </TableCell>
            {/if}
            {#if columns[6].isVisible}
              <TableCell class="py-4 font-medium text-stone-700 tabular-nums">
                <InlineEditableField
                  value={p.usageLimit ?? t("coupons.unlimited")}
                  oninput={(e: any) => tableState.onEdit(p.id, "usageLimit", Number(e.currentTarget.innerText))}
                  field="usageLimit"
                  type="number"
                />
              </TableCell>
            {/if}
            {#if columns[7].isVisible}
              <TableCell class="py-4">
                <select
                  onchange={(e) => tableState.onEdit(p.id, "isActive", e.currentTarget.value === "true" ? 1 : 0)}
                  class="rounded-lg border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-bold uppercase transition-colors
                    {(tableState.editedValues[p.id]?.isActive ?? p.isActive) ? 'text-green-600' : 'text-stone-400'}"
                >
                  <option value="true" selected={(tableState.editedValues[p.id]?.isActive ?? p.isActive) === 1}
                    >{t("coupons.active")}</option
                  >
                  <option value="false" selected={(tableState.editedValues[p.id]?.isActive ?? p.isActive) === 0}
                    >{t("coupons.inactive")}</option
                  >
                </select>
              </TableCell>
            {/if}
            <TableCell align="center" class="py-4">
              <RowActions
                showEdit={false}
                onSave={() => handleSave(p.id)}
                onDelete={() => handleDelete(p.id)}
                isSaving={processingId === p.id && updateMutation.isPending}
                isDeleting={processingId === p.id && deleteMutation.isPending}
              />
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
