<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { fade, fly } from "svelte/transition";
import { trpc } from "../../../lib/trpc";
import type { Order } from "../../../lib/types";
import AdminDataTable from "../AdminDataTable.svelte";
import RowActions from "../RowActions.svelte";
import StatusBadge from "../StatusBadge.svelte";

// Use a subset of Order for the table display
type OrderTableRow = Pick<
  Order,
  "id" | "orderNo" | "customerName" | "total" | "status" | "paymentStatus" | "createdAt"
>;

let {
  rows: initialRows = [],
  total: initialTotal = 0,
  q = "",
  page = 1,
  limit = 20,
}: {
  rows?: OrderTableRow[];
  total?: number;
  q?: string;
  page?: number;
  limit?: number;
} = $props();

const offset = $derived((page - 1) * limit);

const ordersQuery = createQuery(() => ({
  queryKey: ["orders.list", { q, limit, offset }],
  queryFn: () => trpc.orders.list.query({ q, limit, offset }),
  initialData:
    initialRows.length > 0
      ? {
          rows: initialRows,
          total: initialTotal || initialRows.length,
          totalPages: Math.ceil((initialTotal || initialRows.length) / limit),
        }
      : undefined,
  refetchOnMount: false,
  staleTime: 1000 * 60 * 5,
}));

let currentRows = $derived((ordersQuery.data?.rows as OrderTableRow[]) || initialRows);

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
</script>

<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
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
                    transition:fade={{ duration: 200 }}
                    class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
                >
                    <td class="py-4">
                        <span class="font-mono font-bold text-[#c48a3a]"
                            >{order.orderNo}</span
                        >
                    </td>
                    <td class="py-4">
                        <div class="font-bold text-stone-900 flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[10px] text-stone-500">👤</span>
                            {order.customerName}
                        </div>
                    </td>
                    <td class="py-4 tabular-nums font-mono font-bold text-stone-800">
                        <span class="text-stone-400 text-xs mr-1">Rp</span>{order.total?.toLocaleString("id-ID")}
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
                        {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
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
