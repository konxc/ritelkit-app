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

  import { createQuery } from "@tanstack/svelte-query";
  import { fly } from "svelte/transition";
  import { trpc } from "../../../lib/trpc";
  import { untrack } from "svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Badge from "../ui/Badge.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import { createAdminFilters } from "../../../lib/admin-filters.svelte";
  import { createAdminMutation } from "../../../lib/admin-mutations.svelte";
  import AdminDrawerForm from "../ui/overlay/AdminDrawerForm.svelte";
  import Fab from "../ui/Fab.svelte";
  import PaginationNav from "../PaginationNav.svelte";
  import { onMount } from "svelte";

  const filters = createAdminFilters({ q, status, page });
  const localLimit = untrack(() => limit) || 20;

  let toastRef = $state<ToastNotification>();
  let isDrawerOpen = $state(false);
  let processingId = $state<string | null>(null);

  const query = createQuery(() => ({
    queryKey: ["orders", filters.q, filters.status, filters.page],
    queryFn: () =>
      trpc.orders.list.query({
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
    (data: any) => trpc.orders.create.mutate(data),
    {
      invalidateKeys: [["orders"]],
      successMessage: t("orders.toast_created"),
      onSuccess: () => {
        isDrawerOpen = false;
      },
    },
    () => toastRef,
  );

  const deleteMutation = createAdminMutation(
    (id: string) => trpc.orders.delete.mutate(id),
    {
      invalidateKeys: [["orders"]],
      successMessage: t("orders.toast_deleted"),
    },
    () => toastRef,
  );

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const data = {
      orderNo: `ORD-${Date.now()}`,
      customerName: String(formData.get("customerName")),
      customerPhone: String(formData.get("customerPhone")),
      total: Number(formData.get("total")),
      status: "pending",
      paymentStatus: "unpaid",
      source: "admin",
    };
    await createMutation.mutate(data);
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

  const getStatusType = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "success";
      case "processing":
      case "shipped":
        return "info";
      case "pending":
        return "warning";
      case "cancelled":
      case "refunded":
        return "danger";
      default:
        return "default";
    }
  };

  let columns = $state([
    { id: "orderNo", label: t("orders.order_no"), isVisible: true },
    { id: "customer", label: t("orders.customer"), isVisible: true },
    { id: "total", label: t("common.total"), isVisible: true },
    { id: "status", label: t("common.status"), isVisible: true },
    { id: "date", label: t("common.date"), isVisible: true },
  ]);

  const activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("orders.title_list")} muted={t("orders.manager_subtitle")} />

      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="order" q={filters.q} status={filters.status} bind:columns {lang} />

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
            stroke-linejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg
          >
          {t("orders.add_order")}
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("orders.add_order")} />

    {#snippet orderIcon()}
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
        ><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path
          d="M16 10a4 4 0 0 1-8 0"
        /></svg
      >
    {/snippet}

    <AdminDrawerForm
      bind:isOpen={isDrawerOpen}
      title={t("orders.title_add")}
      subtitle={t("orders.manager_subtitle")}
      icon={orderIcon}
      isSubmitting={createMutation.isPending}
      onsubmit={handleCreate}
      formId="order-form"
    >
      <div class="space-y-6">
        <TextInput id="customerName" name="customerName" label={t("orders.customer_name")} required />
        <TextInput id="customerPhone" name="customerPhone" label={t("orders.customer_phone")} required />
        <TextInput id="total" name="total" label={t("common.total")} type="number" required />
      </div>
    </AdminDrawerForm>

    <div class="mt-4">
      <Table headers={activeHeaders}>
        {#if currentRows.length === 0}
          <TableEmptyState title={t("orders.empty")} colspan={activeHeaders.length} />
        {/if}
        {#each currentRows as row (row.id)}
          <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
            {#if columns[0].isVisible}
              <TableCell class="py-4 font-mono font-medium text-stone-600">{row.orderNo}</TableCell>
            {/if}
            {#if columns[1].isVisible}
              <TableCell class="py-4">
                <div class="flex flex-col">
                  <span class="font-bold text-stone-900">{row.customerName}</span>
                  <span class="font-mono text-[10px] text-stone-400">{row.customerPhone}</span>
                </div>
              </TableCell>
            {/if}
            {#if columns[2].isVisible}
              <TableCell class="py-4 font-bold text-stone-800 tabular-nums">
                <span class="mr-1 text-xs text-stone-400">{t("common.currency_symbol")}</span>
                {row.total?.toLocaleString(t("common.lang_code"))}
              </TableCell>
            {/if}
            {#if columns[3].isVisible}
              <TableCell class="py-4">
                <Badge variant={getStatusType(row.status)}>
                  {t(`status.${row.status?.toLowerCase()}`) || row.status}
                </Badge>
              </TableCell>
            {/if}
            {#if columns[4].isVisible}
              <TableCell class="py-4 text-xs font-medium text-stone-400">
                {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
              </TableCell>
            {/if}
            <TableCell align="center" class="py-4">
              <RowActions
                detailHref={`/admin/orders/${row.orderNo}`}
                showSave={false}
                onDelete={() => handleDelete(row.id)}
                isDeleting={processingId === row.id && deleteMutation.isPending}
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
