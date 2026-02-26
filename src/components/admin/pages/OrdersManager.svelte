<script lang="ts">
    import AdminDataTable from "../AdminDataTable.svelte";
    import StatusBadge from "../StatusBadge.svelte";
    import RowActions from "../RowActions.svelte";

    let { rows = [] }: { rows: any[] } = $props();

    const getStatusType = (status: string) => {
        switch (status) {
            case "completed":
                return "success";
            case "processing":
            case "shipped":
                return "warning";
            case "pending":
                return "default";
            case "cancelled":
                return "error";
            default:
                return "default";
        }
    };

    const getPaymentStatusType = (status: string) => {
        switch (status) {
            case "paid":
                return "success";
            case "pending":
                return "warning";
            case "failed":
            case "expired":
                return "error";
            default:
                return "default";
        }
    };
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
            {#if rows.length === 0}
                <tr>
                    <td
                        colspan="7"
                        class="text-center py-12 text-stone-400 text-sm italic"
                    >
                        Belum ada pesanan yang sesuai kriteria.
                    </td>
                </tr>
            {/if}
            {#each rows as order (order.id)}
                <tr
                    class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
                >
                    <td class="py-4">
                        <span class="font-mono font-bold text-[#c48a3a]"
                            >{order.order_no}</span
                        >
                    </td>
                    <td class="py-4">
                        <div class="font-bold text-stone-900">
                            {order.customer_name}
                        </div>
                    </td>
                    <td class="py-4 tabular-nums font-bold text-stone-800">
                        Rp {order.total?.toLocaleString("id-ID")}
                    </td>
                    <td class="py-4">
                        <StatusBadge
                            label={order.status}
                            type={getStatusType(order.status)}
                        />
                    </td>
                    <td class="py-4">
                        <StatusBadge
                            label={order.payment_status}
                            type={getPaymentStatusType(order.payment_status)}
                        />
                    </td>
                    <td class="py-4 text-stone-500 text-sm font-medium">
                        {String(order.created_at).split("T")[0]}
                    </td>
                    <td class="py-4">
                        <RowActions
                            detailHref={`/admin/orders/${order.order_no}`}
                            showSave={false}
                            showDelete={false}
                        />
                    </td>
                </tr>
            {/each}
        </tbody>
    </AdminDataTable>
</div>
