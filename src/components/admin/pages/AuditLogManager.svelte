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
    rows?: AuditLog[];
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
  import type { AuditLog } from "@/lib/types";
  import Table from "@/components/admin/ui/Table.svelte";
  import TableRow from "@/components/admin/ui/TableRow.svelte";
  import TableCell from "@/components/admin/ui/TableCell.svelte";
  import { t, initI18n } from "@/lib/i18n/store.svelte";
  import { untrack } from "svelte";
  import SectionHeader from "@/components/admin/SectionHeader.svelte";
  import AdminHeaderFilters from "@/components/admin/AdminHeaderFilters.svelte";
  import TableEmptyState from "@/components/admin/ui/TableEmptyState.svelte";
  import { createAdminFilters } from "@/lib/admin-filters.svelte";
  import PaginationNav from "@/components/admin/PaginationNav.svelte";
  import { onMount } from "svelte";

  let columns = $state([
    { id: "user", label: t("system_admin.audit_log.user"), isVisible: true },
    { id: "action", label: t("system_admin.audit_log.action"), isVisible: true },
    { id: "entity", label: t("system_admin.audit_log.entity"), isVisible: true },
    { id: "entityId", label: t("system_admin.audit_log.id"), isVisible: true },
    { id: "time", label: t("system_admin.audit_log.time"), isVisible: true },
  ]);

  const filters = createAdminFilters({ q: untrack(() => q), status: "", page: untrack(() => page) });

  const query = createQuery(() => ({
    queryKey: ["auditLogs", filters.q, filters.page],
    queryFn: () =>
      trpc.auditLogs.list.query({
        q: filters.q,
        limit,
        offset: (filters.page - 1) * limit,
      }),
    initialData: filters.isInitial ? { rows: initialRows, count: total || 0 } : undefined,
  }));

  const currentRows = $derived(query.data?.rows || []);

  const activeHeaders = $derived([...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label }))]);

  const totalPages = $derived(Math.max(1, Math.ceil((query.data?.count || 0) / limit)));
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("system.audit")} muted={t("system_admin.audit_log.subtitle")} />

      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="audit" q={filters.q} bind:columns {lang} />
      </div>
    </div>

    <div class="mt-2">
      <Table headers={activeHeaders}>
        {#if currentRows.length === 0}
          <TableEmptyState
            title={t("system_admin.audit_log.empty_title")}
            subtitle={t("system_admin.audit_log.empty_description")}
            colspan={activeHeaders.length}
          />
        {/if}
        {#each currentRows as p (p.id)}
          <TableRow
            data-id={p.id}
            class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50"
          >
            {#if columns[0].isVisible}
              <TableCell class="py-4 text-stone-600">{p.actorEmail || "System"}</TableCell>
            {/if}
            {#if columns[1].isVisible}
              <TableCell class="py-4 font-bold text-stone-900">{p.action}</TableCell>
            {/if}
            {#if columns[2].isVisible}
              <TableCell class="py-4 text-stone-600">{p.entityType}</TableCell>
            {/if}
            {#if columns[3].isVisible}
              <TableCell class="py-4 font-mono text-xs text-stone-400">{p.entityId || "-"}</TableCell>
            {/if}
            {#if columns[4].isVisible}
              <TableCell class="py-4 text-xs text-stone-400">
                {new Date(p.createdAt).toLocaleString()}
              </TableCell>
            {/if}
          </TableRow>
        {/each}
      </Table>

      <PaginationNav
        page={filters.page}
        {totalPages}
        prevHref={filters.page > 1 ? filters.buildPageUrl(filters.page - 1) : undefined}
        nextHref={filters.page < totalPages ? filters.buildPageUrl(filters.page + 1) : undefined}
      />
    </div>
  </div>
</div>
