<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import StatCard from "../ui/StatCard.svelte";
  import Button from "../ui/Button.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Badge from "../ui/Badge.svelte";

  let {
    stats,
    recentOrders = [],
  }: {
    stats: {
      ordersToday: number;
      revenueToday: number;
      activeCoupons: number;
      activeProducts: number;
      pendingShipments: number;
      pendingRefunds: number;
    };
    recentOrders?: any[];
  } = $props();

  const formatCurrency = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 class="font-['Syne',sans-serif] text-3xl font-extrabold tracking-tight text-stone-900">Ringkasan Bisnis</h1>
        <p class="mt-1 text-stone-500">Pantau performa harian Roti Sholawat.</p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"
            ></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg
          >
          Export
        </Button>
        <Button variant="primary" size="sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg
          >
          Order Baru
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Order Hari Ini" value={stats.ordersToday}>
        {#snippet icon()}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline
              points="14 2 14 8 20 8"
            ></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"
            ></line><polyline points="10 9 9 9 8 9"></polyline></svg
          >
        {/snippet}
      </StatCard>
      <StatCard label="Revenue Hari Ini" value={formatCurrency(stats.revenueToday)}>
        {#snippet icon()}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
            ></path></svg
          >
        {/snippet}
      </StatCard>
      <StatCard label="Produk Aktif" value={stats.activeProducts}>
        {#snippet icon()}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><path d="m7.5 4.27 9 5.15" /><path
              d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
            /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg
          >
        {/snippet}
      </StatCard>
      <StatCard label="Pengiriman Aktif" value={stats.pendingShipments}>
        {#snippet icon()}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h2" /><path
              d="M14 17h1"
            /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg
          >
        {/snippet}
      </StatCard>
      <StatCard label="Kupon Aktif" value={stats.activeCoupons}>
        {#snippet icon()}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><path d="M18 20a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h12Z" /><path
              d="M2 12h20"
            /><path d="M6 12v.01" /><path d="M10 12v.01" /><path d="M14 12v.01" /><path d="M18 12v.01" /></svg
          >
        {/snippet}
      </StatCard>
      <StatCard label="Refund Pending" value={stats.pendingRefunds}>
        {#snippet icon()}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><path d="M3 7v6h6" /><path d="M21 17v-6h-6" /><path d="M18.5 4.5A10 10 0 0 0 4 11" /><path
              d="M5.5 19.5A10 10 0 0 0 20 13"
            /></svg
          >
        {/snippet}
      </StatCard>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div
        class="rounded-3xl border border-stone-200/60 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] md:p-8 lg:col-span-2"
      >
        <div class="mb-6 flex items-center justify-between">
          <h2 class="font-['Syne',sans-serif] text-xl font-bold text-stone-800">Pesanan Masuk Terbaru</h2>
          <a
            href="/admin/orders?tab=order"
            class="text-sm font-bold text-[#c48a3a] transition-colors hover:text-[#a6722d]">Lihat Semua</a
          >
        </div>

        {#if recentOrders.length === 0}
          <div
            class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-100 bg-stone-50/50 py-12 text-center"
          >
            <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-stone-300 shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path
                  d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                ></path></svg
              >
            </div>
            <h3 class="mb-1 font-bold text-stone-900">Belum ada pesanan hari ini</h3>
            <p class="max-w-sm text-sm text-stone-500">
              Pesanan yang masuk akan otomatis muncul di sini. Anda juga bisa menambah pesanan manual.
            </p>
          </div>
        {:else}
          <Table headers={["Order No", "Pelanggan", "Total", "Status"]} class="!rounded-none border-none shadow-none">
            {#each recentOrders as order}
              <TableRow class="group border-b border-stone-100 last:border-0 hover:bg-stone-50/50">
                <TableCell class="py-4">
                  <span class="font-bold text-stone-900 transition-colors group-hover:text-[#c48a3a]"
                    >{order.orderNo}</span
                  >
                  <div class="mt-0.5 text-[0.7rem] text-stone-400">
                    {new Date(order.createdAt).toLocaleString("id-ID")}
                  </div>
                </TableCell>
                <TableCell class="py-4">
                  <div class="font-medium text-stone-800">
                    {order.customerName}
                  </div>
                  <div class="text-[0.7rem] text-stone-400">
                    {order.customerPhone}
                  </div>
                </TableCell>
                <TableCell class="py-4 text-[0.85rem] font-bold text-stone-900">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell class="py-4">
                  <Badge variant={order.paymentStatus === "paid" ? "success" : "warning"}>
                    {order.paymentStatus.toUpperCase()}
                  </Badge>
                </TableCell>
              </TableRow>
            {/each}
          </Table>
        {/if}
      </div>

      <div
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-6 text-white shadow-xl shadow-stone-200/50 md:p-8"
      >
        <div
          class="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-[#c48a3a]/10 blur-3xl transition-all duration-700 group-hover:bg-[#c48a3a]/20"
        ></div>
        <div class="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
        <h2 class="relative z-10 mb-6 font-['Syne',sans-serif] text-xl font-bold text-white">Tindakan Cepat</h2>
        <div class="relative z-10 flex flex-col gap-3">
          <a
            href="/admin/catalog?tab=products"
            class="group flex items-center gap-3 rounded-2xl p-3 text-white no-underline transition-colors hover:bg-white/10"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#c48a3a] transition-all group-hover:bg-[#c48a3a] group-hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg
              >
            </div>
            <div>
              <div class="text-[0.95rem] font-bold">Tambah Produk Baru</div>
              <div class="text-xs text-stone-400">Pembaruan ke katalog menu</div>
            </div>
          </a>
          <a
            href="/admin/settings"
            class="group flex items-center gap-3 rounded-2xl p-3 text-white no-underline transition-colors hover:bg-white/10"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-stone-300 transition-all group-hover:bg-white group-hover:text-stone-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><circle cx="12" cy="12" r="3"></circle><path
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                ></path></svg
              >
            </div>
            <div>
              <div class="text-[0.95rem] font-bold">Cek Pengaturan Toko</div>
              <div class="text-xs text-stone-400">Buka pengaturan operasional</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>
