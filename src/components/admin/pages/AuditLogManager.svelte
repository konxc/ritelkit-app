<script lang="ts">
  import { actions } from "astro:actions";
  import { fade, fly } from "svelte/transition";
  import type { AuditLog } from "../../../lib/types";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import { t } from "../../../lib/i18n/store.svelte";
  import { onMount } from "svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import ColumnVisibilityToggle from "../ui/ColumnVisibilityToggle.svelte";

  let {
    rows: initialRows = [],
    q = "",
    page = 1,
    limit = 30,
    lang,
  }: {
    rows?: AuditLog[];
    q?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();

  let columns = $state([
    { id: "user", label: t("system_admin.audit_log.user"), isVisible: true },
    { id: "action", label: t("system_admin.audit_log.action"), isVisible: true },
    { id: "entity", label: t("system_admin.audit_log.entity"), isVisible: true },
    { id: "entityId", label: t("system_admin.audit_log.id"), isVisible: true },
    { id: "time", label: t("system_admin.audit_log.time"), isVisible: true },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
  ]);

  let rows = $state<AuditLog[]>([]);
  let isLoading = $state(false);

  // Sync with initialRows from SSR
  $effect(() => {
    rows = initialRows;
  });

  const refreshData = async () => {
    const offset = (page - 1) * limit;
    isLoading = true;
    const { data, error } = await actions.listAuditLogs({
      q,
      limit,
      offset,
    });
    isLoading = false;
    if (!error && data) {
      rows = data.rows as AuditLog[];
    }
  };

  const syncFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    q = params.get("q") || "";
    page = parseInt(params.get("page") || "1");
  };

  onMount(() => {
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  });

  // Re-fetch when props change (search/pagination)
  $effect(() => {
    refreshData();
  });
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("system.audit")} muted={t("system_admin.audit_log.subtitle")} />
      
      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <div class="mr-2">
          <AdminHeaderFilters tab="audit" {q} {columns} {lang} />
        </div>

        <ColumnVisibilityToggle bind:columns />

        <div class="h-10 w-px bg-stone-200/80"></div>
      </div>
    </div>

    <div class="mt-2">
      <Table headers={activeHeaders}>
        {#if rows.length === 0}
          <TableEmptyState
            title={t("system_admin.audit_log.empty_title")}
            subtitle={t("system_admin.audit_log.empty")}
            colspan={activeHeaders.length}
          />
        {/if}
        {#each rows as r (r.id)}
          <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
            {#if columns[0].isVisible}
              <TableCell class="py-4 font-bold text-stone-900">{r.actorEmail || "-"}</TableCell>
            {/if}
            {#if columns[1].isVisible}
              <TableCell class="py-4">
                <span class="rounded-md bg-stone-100 px-2 py-1 text-xs font-bold tracking-wider text-stone-600 uppercase">
                  {r.action}
                </span>
              </TableCell>
            {/if}
            {#if columns[2].isVisible}
              <TableCell class="py-4 font-medium text-stone-600">{r.entityType || "-"}</TableCell>
            {/if}
            {#if columns[3].isVisible}
              <TableCell class="py-4 font-mono text-xs text-stone-400">{r.entityId || "-"}</TableCell>
            {/if}
            {#if columns[4].isVisible}
              <TableCell class="py-4 font-medium text-stone-500">
                {String(r.createdAt || "")
                  .replace("T", " ")
                  .split(".")[0]}
              </TableCell>
            {/if}
          </TableRow>
        {/each}
      </Table>
    </div>
  </div>
</div>
