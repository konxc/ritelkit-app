<script lang="ts">
    import AdminDataTable from "../AdminDataTable.svelte";
    import StatusBadge from "../StatusBadge.svelte";
    import RowActions from "../RowActions.svelte";
    import { trpc } from "../../../lib/trpc";
    import { createQuery } from "@tanstack/svelte-query";

    let { rows: initialRows = [] }: { rows: any[] } = $props();

    const ordersQuery = createQuery({
        queryKey: ["orders"],
        queryFn: () => trpc.orders.list.query({}),
        initialData: () => ({
            rows: initialRows,
            total: initialRows.length,
            totalPages: 1,
        }),
    });

    const getStatusType = (status: string) => {
        if (!status) return "default";
        switch (status.toLowerCase()) {
            case "completed":
                return "success";
            case "processing":
            case "shipped":
                return "warning";
            case "pending":
                return "default";
            case "cancelled":
                return "danger";
            default:
                return "default";
        }
    };

    const getPaymentStatusType = (status: string) => {
        if (!status) return "default";
        switch (status.toLowerCase()) {
            case "paid":
                return "success";
            case "pending":
                return "warning";
            case "failed":
            case "expired":
                return "danger";
            default:
                return "default";
        }
    };

    const currentRows = $derived($ordersQuery.data?.rows || initialRows);
</script>

<div class="animate-fade-in">
    <AdminDataTable>
        <thead>
            <tr>
                <th>Order No</th>
                <th>Pelanggan</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Tanggal</th>
                <th>Aksi</th>
            </tr>
        </thead>
        <tbody>
            {#if currentRows.length === 0}
                <tr>
                    <td
                        colspan="7"
                        class="text-center py-12 text-stone-400 text-sm italic"
                    >
                        Belum ada pesanan yang sesuai kriteria.
                    </td>
                </tr>
            {/if}
            {#each currentRows as order (order.id)}
                <tr
                    class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
                >
                    <td class="py-4">
                        <span class="font-mono font-bold text-[#c48a3a]"
                            >{order.orderNo}</span
                        >
                    </td>
                    <td class="py-4">
                        <div class="font-bold text-stone-900">
                            {order.customerName}
                        </div>
                    </td>
                    <td class="py-4 tabular-nums font-bold text-stone-800">
                        Rp {order.total?.toLocaleString("id-ID")}
                    </td>
                    <td class="py-4">
                        <StatusBadge
                            label={order.status}
                            tone={getStatusType(order.status)}
                        />
                    </td>
                    <td class="py-4">
                        <StatusBadge
                            label={order.paymentStatus}
                            tone={getPaymentStatusType(order.paymentStatus)}
                        />
                    </td>

                    <td class="py-4 text-stone-500 text-sm font-medium">
                        {String(order.createdAt).split("T")[0]}
                    </td>
                    <td class="py-4">
                        <RowActions
                            detailHref={`/admin/orders/${order.orderNo}`}
                            showSave={false}
                            showDelete={false}
                        />
                    </td>
                </tr>
            {/each}
        </tbody>
    </AdminDataTable>
</div>
