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
    rows?: any[];
    total?: number;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();
  initI18n(untrack(() => lang));

  import { trpc } from "@lib/trpc";
  import { createQuery } from "@tanstack/svelte-query";
  import { t, initI18n } from "@lib/i18n/store.svelte";
  import { onMount, untrack } from "svelte";
  import { fly } from "svelte/transition";
  import TableEmptyState from "@components/admin/ui/TableEmptyState.svelte";
  import SectionHeader from "@components/admin/SectionHeader.svelte";
  import ToastNotification from "@components/admin/ToastNotification.svelte";
  import Table from "@components/admin/ui/Table.svelte";
  import TableRow from "@components/admin/ui/TableRow.svelte";
  import TableCell from "@components/admin/ui/TableCell.svelte";
  import Badge from "@components/admin/ui/Badge.svelte";
  import Button from "@components/admin/ui/Button.svelte";
  import TextInput from "@components/admin/ui/forms/TextInput.svelte";
  import SelectInput from "@components/admin/ui/forms/SelectInput.svelte";
  import AdminHeaderFilters from "@components/admin/AdminHeaderFilters.svelte";
  import { createAdminFilters } from "@lib/admin-filters.svelte";
  import { createAdminMutation } from "@lib/admin-mutations.svelte";
  import AdminDrawerForm from "@components/admin/ui/overlay/AdminDrawerForm.svelte";
  import Fab from "@components/admin/ui/Fab.svelte";
  import PaginationNav from "@components/admin/PaginationNav.svelte";

  const filters = createAdminFilters({ q: untrack(() => q), status: untrack(() => status), page: untrack(() => page) });
  const localLimit = untrack(() => limit) || 20;

  let toastRef = $state<ToastNotification>();
  let isDrawerOpen = $state(false);

  let columns = $state([
    { id: "orderNo", label: t("orders.order_no"), isVisible: true, class: "font-mono font-medium text-stone-600" },
    {
      id: "amount",
      label: t("refunds.amount"),
      isVisible: true,
      class: "font-mono font-bold text-stone-800 tabular-nums",
    },
    { id: "status", label: t("common.status"), isVisible: true },
    { id: "reason", label: t("refunds.reason"), isVisible: true, class: "text-sm text-stone-500 italic" },
    { id: "createdAt", label: t("common.date"), isVisible: true, class: "hidden lg:table-cell" },
  ]);

  const query = createQuery(() => ({
    queryKey: ["refunds", filters.q, filters.status, filters.page],
    queryFn: () =>
      trpc.refunds.list.query({
        q: filters.q,
        status: filters.status ? [filters.status] : undefined,
        limit: localLimit,
        offset: (filters.page - 1) * localLimit,
      }),
    initialData: filters.isInitial ? { rows: initialRows, total: initialTotal } : undefined,
  }));

  const currentRows = $derived(query.data?.rows || []);
  const totalPages = $derived(Math.max(1, Math.ceil((query.data?.total || 0) / localLimit)));

  const createMutation = createAdminMutation(
    (data: any) => trpc.refunds.create.mutate(data),
    {
      invalidateKeys: [["refunds"]],
      successMessage: t("refunds.toast_add"),
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
      orderNo: String(formData.get("orderNo")),
      amount: Number(formData.get("amount")),
      reason: String(formData.get("reason")),
      status: String(formData.get("status")),
    };
    await createMutation.mutate(data);
  };

  const getStatusType = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "danger";
      default:
        return "default";
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
      <SectionHeader title={t("refunds.title")} muted={t("orders.subtitle_list")} />

      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="refunds" q={filters.q} status={filters.status} bind:columns {lang} />

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
              ><path d="M3 2v6h6" /><path d="M3 13a9 9 0 1 0 3-7.7L3 8" /><path d="M12 7v5l4 2" /></svg
            >
            {t("refunds.title_create")}
          </div>
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("refunds.title_create")} />

    {#snippet refundIcon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"><path d="M3 2v6h6" /><path d="M3 13a9 9 0 1 0 3-7.7L3 8" /><path d="M12 7v5l4 2" /></svg
      >
    {/snippet}

    <AdminDrawerForm
      bind:isOpen={isDrawerOpen}
      title={t("refunds.title_create")}
      subtitle={t("refunds.title")}
      icon={refundIcon}
      isSubmitting={createMutation.isPending}
      onsubmit={handleCreate}
      formId="refund-form"
    >
      <div class="space-y-6">
        <TextInput id="orderNo" name="orderNo" label={t("orders.order_no")} required placeholder="ORD-123456" />
        <TextInput id="amount" name="amount" label={t("refunds.amount")} type="number" required placeholder="0" />
        <TextInput id="reason" name="reason" label={t("refunds.reason")} placeholder="Reason for refund" />
        <SelectInput id="status" name="status" label={t("common.status")} value="pending">
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </SelectInput>
      </div>
    </AdminDrawerForm>

    <div class="mt-4">
      <Table headers={activeHeaders}>
        {#if currentRows.length === 0}
          <TableEmptyState title={t("refunds.empty")} colspan={activeHeaders.length} />
        {/if}
        {#each currentRows as row (row.id)}
          <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
            {#if columns[0].isVisible}
              <TableCell class="py-4 font-mono font-medium text-stone-600">{row.orderNo}</TableCell>
            {/if}
            {#if columns[1].isVisible}
              <TableCell class="py-4 font-mono font-bold text-stone-800 tabular-nums">
                <span class="mr-1 text-xs text-stone-400">{t("common.currency_symbol")}</span>
                {row.amount?.toLocaleString(t("common.lang_code"))}
              </TableCell>
            {/if}
            {#if columns[2].isVisible}
              <TableCell class="py-4">
                <Badge variant={getStatusType(row.status)}>
                  {t(`orders.statuses.${row.status?.toLowerCase()}`) || row.status}
                </Badge>
              </TableCell>
            {/if}
            {#if columns[3].isVisible}
              <TableCell class="max-w-[200px] truncate py-4 text-sm text-stone-500 italic"
                >{row.reason || "-"}</TableCell
              >
            {/if}
            {#if columns[4].isVisible}
              <TableCell class="py-4 text-sm font-medium text-stone-400">
                {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
              </TableCell>
            {/if}
            <TableCell align="center" class="py-4">
              <Button
                variant="secondary"
                outline
                class="h-8 border-stone-200 px-3 text-[10px] font-bold tracking-widest uppercase"
              >
                {t("common.detail")}
              </Button>
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
