<script lang="ts">
  import { actions } from "astro:actions";
  import { fade, fly } from "svelte/transition";
  import type { AuditLog } from "../../../lib/types";
  import EmptyState from "../ui/EmptyState.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";

  let {
    rows: initialRows = [],
    q = "",
    page = 1,
    limit = 30,
  }: {
    rows?: AuditLog[];
    q?: string;
    page?: number;
    limit?: number;
  } = $props();

  let rows = $state<AuditLog[]>([]);
  $effect(() => {
    rows = initialRows;
  });
  const offset = $derived((page - 1) * limit);

  // Sync with initialRows from SSR
  $effect(() => {
    rows = initialRows;
  });

  const refreshData = async () => {
    const { data, error } = await actions.listAuditLogs({
      q,
      limit,
      offset,
    });
    if (!error && data) {
      rows = data.rows as AuditLog[];
    }
  };

  // Re-fetch when props change (search/pagination)
  $effect(() => {
    refreshData();
  });
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <Table headers={["Aktor", "Aksi", "Entity", "ID", "Waktu"]}>
      {#if rows.length === 0}
        <TableRow>
          <TableCell colspan={5} class="border-0 p-0">
            <EmptyState
              title="Log Kosong"
              description="Belum ada catatan aktivitas sistem."
              class="!rounded-none !border-0 !bg-transparent py-16 !shadow-none"
            />
          </TableCell>
        </TableRow>
      {/if}
      {#each rows as r (r.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          <TableCell class="py-4 font-bold text-stone-900">{r.actorEmail || "-"}</TableCell>
          <TableCell class="py-4">
            <span class="rounded-md bg-stone-100 px-2 py-1 text-xs font-bold tracking-wider text-stone-600 uppercase">
              {r.action}
            </span>
          </TableCell>
          <TableCell class="py-4 font-medium text-stone-600">{r.entityType || "-"}</TableCell>
          <TableCell class="py-4 font-mono text-xs text-stone-400">{r.entityId || "-"}</TableCell>
          <TableCell class="py-4 font-medium text-stone-500">
            {String(r.createdAt || "")
              .replace("T", " ")
              .split(".")[0]}
          </TableCell>
        </TableRow>
      {/each}
    </Table>
  </div>
</div>
