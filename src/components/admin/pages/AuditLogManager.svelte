<script lang="ts">
    import AdminDataTable from "../AdminDataTable.svelte";

    let { rows = [] }: { rows: any[] } = $props();
</script>

<div class="animate-fade-in">
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
                    class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
                >
                    <td class="py-4 font-bold text-stone-900"
                        >{r.actor_email || "-"}</td
                    >
                    <td class="py-4">
                        <span
                            class="px-2 py-1 rounded-md bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wider"
                        >
                            {r.action}
                        </span>
                    </td>
                    <td class="py-4 text-stone-600 font-medium"
                        >{r.entity_type}</td
                    >
                    <td class="py-4 font-mono text-xs text-stone-400"
                        >{r.entity_id || "-"}</td
                    >
                    <td class="py-4 text-stone-500 font-medium">
                        {String(r.created_at).replace("T", " ").split(".")[0]}
                    </td>
                </tr>
            {/each}
        </tbody>
    </AdminDataTable>
</div>
