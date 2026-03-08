<script lang="ts">
import { fade, fly } from "svelte/transition";
import SectionHeader from "../SectionHeader.svelte";
import StatCard from "../StatCard.svelte";
import Table from "../ui/Table.svelte";
import TableRow from "../ui/TableRow.svelte";
import TableCell from "../ui/TableCell.svelte";

let {
  reportData,
}: {
  reportData: {
    thirtyDays: {
      totalOrders: number;
      paidOrders: number;
      revenue: number;
      discountTotal: number;
      cogs: number;
      refundTotal: number;
      grossProfit: number;
    };
    topProducts: any[];
    analytics: {
      ltv: number;
      roas: string;
      cohorts: any[];
    };
  };
} = $props();

const formatCurrency = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mb-4">
      <SectionHeader title="Ringkasan 30 Hari" badge="Keuangan" />
    </div>
    <div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StatCard
        label="Total Order"
        value={reportData.thirtyDays.totalOrders}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`}
      />
      <StatCard
        label="Order Paid"
        value={reportData.thirtyDays.paidOrders}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m9 15 2 2 4-4"></path></svg>`}
      />
      <StatCard
        label="Revenue"
        value={formatCurrency(reportData.thirtyDays.revenue)}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`}
      />
      <StatCard
        label="Diskon"
        value={formatCurrency(reportData.thirtyDays.discountTotal)}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>`}
      />
      <StatCard
        label="COGS (estimasi)"
        value={formatCurrency(reportData.thirtyDays.cogs)}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`}
      />
      <StatCard
        label="Refund"
        value={formatCurrency(reportData.thirtyDays.refundTotal)}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17v-6h-6"/><path d="M18.5 4.5A10 10 0 0 0 4 11"/><path d="M5.5 19.5A10 10 0 0 0 20 13"/></svg>`}
      />
      <StatCard
        label="Gross Profit"
        value={formatCurrency(reportData.thirtyDays.grossProfit)}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>`}
      />
    </div>

    <div class="mb-4">
      <SectionHeader title="Top Produk" muted="Berdasarkan qty terjual" />
    </div>
    <Table headers={["Produk", "Qty"]}>
      {#if reportData.topProducts.length === 0}
        <TableRow>
          <TableCell colspan={2} class="py-8 text-center text-sm text-stone-400 italic">
            Belum ada data produk terjual 30 hari terakhir.
          </TableCell>
        </TableRow>
      {:else}
        {#each reportData.topProducts as item}
          <TableRow class="group transition-colors hover:bg-stone-50/50">
            <TableCell class="px-4 py-4 font-medium text-stone-900">{item.name}</TableCell>
            <TableCell class="px-4 py-4 font-medium text-stone-700 tabular-nums">{item.qty}</TableCell>
          </TableRow>
        {/each}
      {/if}
    </Table>
    <div class="mb-12"></div>

    <div class="mb-4">
      <SectionHeader title="Analitik Dasar" badge="LTV • Cohort • ROAS" />
    </div>
    <div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StatCard
        label="LTV (90 hari)"
        value={formatCurrency(reportData.analytics.ltv)}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`}
      />
      <StatCard
        label="ROAS (30 hari)"
        value={reportData.analytics.roas}
        icon={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`}
      />
    </div>
    <div class="mb-4">
      <SectionHeader title="Cohort (customer baru/bulan)" muted="30 hari terakhir" />
    </div>
    <Table headers={["Bulan", "Customer Baru"]}>
      {#if reportData.analytics.cohorts.length === 0}
        <TableRow>
          <TableCell colspan={2} class="py-8 text-center text-sm text-stone-400 italic">
            Belum ada data cohort customer baru 30 hari terakhir.
          </TableCell>
        </TableRow>
      {:else}
        {#each reportData.analytics.cohorts as c}
          <TableRow class="group transition-colors hover:bg-stone-50/50">
            <TableCell class="px-4 py-4 font-medium text-stone-900">{c.month}</TableCell>
            <TableCell class="px-4 py-4 font-medium text-stone-700 tabular-nums">{c.count}</TableCell>
          </TableRow>
        {/each}
      {/if}
    </Table>
  </div>
</div>
