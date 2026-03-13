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

  import { trpc } from "../../../lib/trpc";
  import { createQuery } from "@tanstack/svelte-query";
  import { fly } from "svelte/transition";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import { onMount, untrack } from "svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Badge from "../ui/Badge.svelte";
  import Button from "../ui/Button.svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import { createAdminFilters } from "../../../lib/admin-filters.svelte";
  import PaginationNav from "../PaginationNav.svelte";

  const filters = createAdminFilters({ q, status, page });
  const localLimit = untrack(() => limit) || 20;

  let columns = $state([
    { id: "invoiceNo", label: t("invoices.id"), isVisible: true, class: "font-mono font-bold text-[#c48a3a]" },
    { id: "orderNo", label: t("invoices.order_no"), isVisible: true, class: "font-mono font-medium text-stone-600" },
    {
      id: "total",
      label: t("orders.total"),
      isVisible: true,
      class: "font-mono font-bold text-stone-800 tabular-nums",
    },
    { id: "status", label: t("common.status"), isVisible: true },
    { id: "date", label: t("common.date"), isVisible: true, class: "hidden lg:table-cell" },
  ]);

  const query = createQuery(() => ({
    queryKey: ["invoices", filters.q, filters.status, filters.page],
    queryFn: () =>
      trpc.invoices.list.query({
        q: filters.q,
        status: filters.status ? [filters.status] : undefined,
        limit: localLimit,
        offset: (filters.page - 1) * localLimit,
      }),
    initialData: filters.isInitial ? { rows: initialRows, total: initialTotal } : undefined,
  }));

  const currentRows = $derived(query.data?.rows || []);
  const totalPages = $derived(Math.max(1, Math.ceil((query.data?.total || 0) / localLimit)));

  const getStatusType = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "success";
      case "unpaid":
        return "warning";
      case "cancelled":
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
      <SectionHeader title={t("invoices.title")} muted={t("invoices.subtitle_list")} />

      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="invoices" q={filters.q} status={filters.status} bind:columns {lang} />
      </div>
    </div>

    <div class="mt-4">
      <Table headers={activeHeaders}>
        {#if currentRows.length === 0}
          <TableEmptyState title={t("invoices.empty")} colspan={activeHeaders.length} />
        {/if}
        {#each currentRows as row (row.id)}
          <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
            {#if columns[0].isVisible}
              <TableCell class="py-4 font-mono font-bold text-[#c48a3a]">{row.invoiceNo}</TableCell>
            {/if}
            {#if columns[1].isVisible}
              <TableCell class="py-4 font-mono font-medium text-stone-600">{row.orderNo}</TableCell>
            {/if}
            {#if columns[2].isVisible}
              <TableCell class="py-4 font-mono font-bold text-stone-800 tabular-nums">
                <span class="mr-1 text-xs text-stone-400">{t("common.currency_symbol")}</span>
                {row.total?.toLocaleString(t("common.lang_code"))}
              </TableCell>
            {/if}
            {#if columns[3].isVisible}
              <TableCell class="py-4">
                <Badge variant={getStatusType(row.status)}>
                  {t(`invoices.statuses.${row.status?.toLowerCase()}`) || row.status}
                </Badge>
              </TableCell>
            {/if}
            {#if columns[4].isVisible}
              <TableCell class="py-4 text-sm font-medium text-stone-500">
                {new Date(row.issuedAt).toLocaleDateString(t("common.lang_code"), {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
            {/if}
            <TableCell align="center" class="py-4">
              <Button
                href={`/admin/invoices/${row.invoiceNo}`}
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
</div>
