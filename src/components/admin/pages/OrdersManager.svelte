<script lang="ts">
  import { createQuery } from "@tanstack/svelte-query";
  import { fade, fly } from "svelte/transition";
  import { trpc } from "../../../lib/trpc";
  import { onMount } from "svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import type { Order } from "../../../lib/types";
  import RowActions from "../RowActions.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Badge from "../ui/Badge.svelte";

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

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <Table
      headers={[
        t("orders.order_no"),
        t("orders.customer"),
        t("orders.total"),
        t("orders.status"),
        t("orders.payment"),
        t("orders.date"),
        t("common.actions"),
      ]}
    >
      {#if currentRows.length === 0}
        <TableRow>
          <TableCell colspan={7} class="py-12 text-center text-sm text-stone-400 italic">
            {t("orders.empty")}
          </TableCell>
        </TableRow>
      {/if}
      {#each currentRows as order (order.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          <TableCell class="py-4">
            <span class="font-mono font-bold text-[#c48a3a]">{order.orderNo}</span>
          </TableCell>
          <TableCell class="py-4">
            <div class="flex items-center gap-2 font-bold text-stone-900">
              <span
                class="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-[10px] text-stone-500"
                >👤</span
              >
              {order.customerName}
            </div>
          </TableCell>
          <TableCell class="py-4 font-mono font-bold text-stone-800 tabular-nums">
            <span class="mr-1 text-xs text-stone-400">{t("common.currency_symbol")}</span>{order.total?.toLocaleString(
              t("common.lang_code"),
            )}
          </TableCell>
          <TableCell class="py-4">
            <Badge variant={getStatusType(order.status)}>
              {t(`orders.statuses.${order.status?.toLowerCase()}`) || order.status}
            </Badge>
          </TableCell>
          <TableCell class="py-4">
            <Badge variant={getPaymentStatusType(order.paymentStatus)}>
              {t(`orders.payments.${order.paymentStatus?.toLowerCase()}`) || order.paymentStatus}
            </Badge>
          </TableCell>

          <TableCell class="py-4 text-sm font-medium text-stone-500">
            {new Date(order.createdAt).toLocaleDateString(t("common.lang_code"), {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </TableCell>
          <TableCell align="center" class="py-4">
            <div class="flex items-center justify-center">
              <RowActions detailHref={`/admin/orders/${order.orderNo}`} showSave={false} showDelete={false} />
            </div>
          </TableCell>
        </TableRow>
      {/each}
    </Table>
  </div>
</div>
