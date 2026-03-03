<script lang="ts">
import { fade, fly } from "svelte/transition";
import StatCard from "../StatCard.svelte";

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

<div class="w-full h-full">
<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
<div
    class="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
>
    <div>
        <h1
            class="font-['Syne',sans-serif] text-3xl font-extrabold text-stone-900 tracking-tight"
        >
            Ringkasan Bisnis
        </h1>
        <p class="text-stone-500 mt-1">Pantau performa harian Roti Sholawat.</p>
    </div>
    <div class="flex items-center gap-3">
        <button
            class="px-4 py-2 bg-stone-100 text-stone-600 font-bold text-sm rounded-xl hover:bg-stone-200 transition-colors flex items-center gap-2"
        >
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
                ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                ></path><polyline points="7 10 12 15 17 10"></polyline><line
                    x1="12"
                    x2="12"
                    y1="15"
                    y2="3"
                ></line></svg
            >
            Export
        </button>
        <button
            class="px-4 py-2 bg-gradient-to-r from-[#c48a3a] to-[#a6722d] text-white font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(196,138,58,0.25)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
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
                ><path d="M5 12h14"></path><path d="M12 5v14"></path></svg
            >
            Order Baru
        </button>
    </div>
</div>

<div
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
>
    <StatCard
        label="Order Hari Ini"
        value={stats.ordersToday}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`}
    />
    <StatCard
        label="Revenue Hari Ini"
        value={formatCurrency(stats.revenueToday)}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`}
    />
    <StatCard
        label="Produk Aktif"
        value={stats.activeProducts}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`}
    />
    <StatCard
        label="Pengiriman Aktif"
        value={stats.pendingShipments}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h2"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`}
    />
    <StatCard
        label="Kupon Aktif"
        value={stats.activeCoupons}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h12Z"/><path d="M2 12h20"/><path d="M6 12v.01"/><path d="M10 12v.01"/><path d="M14 12v.01"/><path d="M18 12v.01"/></svg>`}
    />
    <StatCard
        label="Refund Pending"
        value={stats.pendingRefunds}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17v-6h-6"/><path d="M18.5 4.5A10 10 0 0 0 4 11"/><path d="M5.5 19.5A10 10 0 0 0 20 13"/></svg>`}
    />
</div>

<div
    class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6"
>
    <div
        class="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-stone-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
    >
        <div class="flex items-center justify-between mb-6">
            <h2
                class="font-['Syne',sans-serif] text-xl font-bold text-stone-800"
            >
                Pesanan Masuk Terbaru
            </h2>
            <a
                href="/admin/pesanan?tab=order"
                class="text-sm font-bold text-[#c48a3a] hover:text-[#a6722d] transition-colors"
                >Lihat Semua</a
            >
        </div>

        {#if recentOrders.length === 0}
            <div
                class="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-stone-100 rounded-2xl bg-stone-50/50"
            >
                <div
                    class="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-stone-300 mb-4"
                >
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
                        ><rect width="8" height="4" x="8" y="2" rx="1" ry="1"
                        ></rect><path
                            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                        ></path></svg
                    >
                </div>
                <h3 class="font-bold text-stone-900 mb-1">
                    Belum ada pesanan hari ini
                </h3>
                <p class="text-sm text-stone-500 max-w-sm">
                    Pesanan yang masuk akan otomatis muncul di sini. Anda juga
                    bisa menambah pesanan manual.
                </p>
            </div>
        {:else}
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr
                            class="text-[0.7rem] uppercase tracking-wider text-stone-400 font-bold border-b border-stone-100"
                        >
                            <th class="pb-3">Order No</th>
                            <th class="pb-3">Pelanggan</th>
                            <th class="pb-3">Total</th>
                            <th class="pb-3">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-stone-50">
                        {#each recentOrders as order}
                            <tr
                                transition:fade={{ duration: 200 }}
                                class="group">
                                <td class="py-4">
                                    <span
                                        class="font-bold text-stone-900 group-hover:text-primary transition-colors"
                                        >{order.orderNo}</span
                                    >
                                    <div
                                        class="text-[0.7rem] text-stone-400 mt-0.5"
                                    >
                                        {new Date(
                                            order.createdAt,
                                        ).toLocaleString("id-ID")}
                                    </div>
                                </td>
                                <td class="py-4">
                                    <div class="font-medium text-stone-800">
                                        {order.customerName}
                                    </div>
                                    <div class="text-[0.7rem] text-stone-400">
                                        {order.customerPhone}
                                    </div>
                                </td>
                                <td class="py-4 font-bold text-stone-900">
                                    {formatCurrency(order.total)}
                                </td>
                                <td class="py-4">
                                    <span
                                        class="px-2.5 py-1 rounded-lg text-[0.7rem] font-bold {order.paymentStatus ===
                                        'paid'
                                            ? 'bg-green-50 text-green-600'
                                            : 'bg-amber-50 text-amber-600'}"
                                    >
                                        {order.paymentStatus.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>

    <div
        class="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-6 md:p-8 shadow-lg text-white relative overflow-hidden"
    >
        <div
            class="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"
        ></div>
        <h2
            class="font-['Syne',sans-serif] text-xl font-bold text-white mb-6 relative z-10"
        >
            Tindakan Cepat
        </h2>
        <div class="flex flex-col gap-3 relative z-10">
            <a
                href="/admin/katalog?tab=produk"
                class="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors group no-underline text-white"
            >
                <div
                    class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-[#c48a3a] group-hover:text-white transition-all text-[#c48a3a]"
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
                        ><path d="M5 12h14"></path><path d="M12 5v14"
                        ></path></svg
                    >
                </div>
                <div>
                    <div class="font-bold text-[0.95rem]">
                        Tambah Produk Baru
                    </div>
                    <div class="text-xs text-stone-400">
                        Pembaruan ke katalog menu
                    </div>
                </div>
            </a>
            <a
                href="/admin/settings"
                class="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors group no-underline text-white"
            >
                <div
                    class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-stone-900 transition-all text-stone-300"
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
                    <div class="font-bold text-[0.95rem]">
                        Cek Pengaturan Toko
                    </div>
                    <div class="text-xs text-stone-400">
                        Buka pengaturan operasional
                    </div>
                </div>
            </a>
        </div>
    </div>
</div>
</div>

</div>
