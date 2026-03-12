<script lang="ts">
  import { actions } from "astro:actions";
  import { fade, fly } from "svelte/transition";
  import type { AuditLog } from "../../../lib/types";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import { onMount, untrack } from "svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";

  let {
    rows: initialRows = [],
    q = "",
    status = "",
    page = 1,
    limit = 30,
    lang,
  }: {
    rows?: AuditLog[];
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();

  initI18n(untrack(() => lang));

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

  let localQ = $state(untrack(() => q));
  let localStatus = $state(untrack(() => status));
  let localPage = $state(untrack(() => page));

  function syncFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    localQ = params.get("q") || "";
    localPage = parseInt(params.get("page") || "1", 10);
  }

  onMount(() => {
    syncFiltersFromUrl();
    window.addEventListener("popstate", syncFiltersFromUrl);
    window.addEventListener("astro:after-navigation", syncFiltersFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFiltersFromUrl);
      window.removeEventListener("astro:after-navigation", syncFiltersFromUrl);
    };
  });

  $effect(() => {
    refreshData();
  });

  const refreshData = async () => {
    const offset = (localPage - 1) * limit;
    isLoading = true;
    const { data, error } = await actions.listAuditLogs({
      q: localQ,
      limit,
      offset,
    });
    isLoading = false;
    if (!error && data) {
      rows = data.rows as AuditLog[];
    }
  };

</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("system.audit")} muted={t("system_admin.audit_log.subtitle")} />
      
      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="audit" q={localQ} status={localStatus} bind:columns {lang} />
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
                <span
                  class={`rounded-md px-2 py-1 text-xs font-bold tracking-wider uppercase ${
                    r.action.toLowerCase().includes("delete")
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : r.action.toLowerCase().includes("create")
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : r.action.toLowerCase().includes("update")
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-stone-100 text-stone-600 border border-stone-200"
                  }`}
                >
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
