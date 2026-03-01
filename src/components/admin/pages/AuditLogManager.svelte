<script lang="ts">
import { actions } from "astro:actions";
import { fade, fly } from "svelte/transition";
import type { AuditLog } from "../../../lib/types";
import AdminDataTable from "../AdminDataTable.svelte";

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
  const { data, error } = await actions.listAuditLogs({ q, limit, offset });
  if (!error && data) {
    rows = data.rows as AuditLog[];
  }
};

// Re-fetch when props change (search/pagination)
$effect(() => {
  refreshData();
});
</script>

<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <AdminDataTable>
        <thead>
            <tr>
                <th>Aktor</th>
                <th>Aksi</th>
                <th>Entity</th>
                <th>ID</th>
                <th>Waktu</th>
            </tr>
        </thead>
        <tbody>
            {#if rows.length === 0}
                <tr>
                    <td
                        colspan="5"
                        class="text-center py-12 text-stone-400 text-sm italic"
                    >
                        Belum ada catatan aktivitas.
                    </td>
                </tr>
            {/if}
            {#each rows as r (r.id)}
                <tr
                    transition:fade={{ duration: 200 }}
                    class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
                >
                    <td class="py-4 font-bold text-stone-900"
                        >{r.actorEmail || "-"}</td
                    >
                    <td class="py-4">
                        <span
                            class="px-2 py-1 rounded-md bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wider"
                        >
                            {r.action}
                        </span>
                    </td>
                    <td class="py-4 text-stone-600 font-medium"
                        >{r.entityType || "-"}</td
                    >
                    <td class="py-4 font-mono text-xs text-stone-400"
                        >{r.entityId || "-"}</td
                    >
                    <td class="py-4 text-stone-500 font-medium">
                        {String(r.createdAt || "")
                            .replace("T", " ")
                            .split(".")[0]}
                    </td>
                </tr>
            {/each}
        </tbody>
    </AdminDataTable>
</div>
