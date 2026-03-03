<script lang="ts">
import { trpc } from "../../../lib/trpc";
import { fade, fly } from "svelte/transition";
import { createQuery, useQueryClient } from "@tanstack/svelte-query";
import AdminDataTable from "../AdminDataTable.svelte";
import CrudInlineForm from "../CrudInlineForm.svelte";
import RowActions from "../RowActions.svelte";
import SectionHeader from "../SectionHeader.svelte";
import StatusBadge from "../StatusBadge.svelte";
import ToastNotification from "../ToastNotification.svelte";

export type RefundRow = {
  id: string | number;
  orderNo: string;
  amount: number;
  status: string;
  providerStatus?: string | null;
  providerResponseJson?: string | null;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

let {
  rows: initialRows = [],
  page = 1,
  limit = 20,
}: {
  rows?: RefundRow[];
  page?: number;
  limit?: number;
} = $props();

const offset = $derived((page - 1) * limit);
const queryClient = useQueryClient();

let toastRef = $state<ToastNotification>();
let isSubmitting = $state(false);

const refundsQuery = createQuery(() => ({
  queryKey: ["refunds.list", { limit, offset }],
  queryFn: () => trpc.refunds.list.query({ limit, offset }),
  initialData:
    initialRows.length > 0 ? { rows: initialRows, total: initialRows.length } : undefined,
  refetchOnMount: false,
  staleTime: 1000 * 60 * 5,
}));

let currentRefunds = $derived((refundsQuery.data?.rows as RefundRow[]) || initialRows);
let total = $derived(refundsQuery.data?.total || 0);
let isFetching = $derived(refundsQuery.isFetching);

let savingId = $state<string | null>(null);
let deletingId = $state<string | null>(null);

const handleCreate = async (event: SubmitEvent) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const formData = new FormData(form);

  isSubmitting = true;
  try {
    await trpc.refunds.create.mutate({
      orderNo: formData.get("order_no") as string,
      amount: Number(formData.get("amount")),
      status: formData.get("status") as string,
      reason: (formData.get("reason") as string) || undefined,
    });

    toastRef?.show("Refund berhasil ditambah!", "success");
    form.reset();
    queryClient.invalidateQueries({ queryKey: ["refunds.list"] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    toastRef?.show(message, "error");
  } finally {
    isSubmitting = false;
  }
};

const handleRowAction = async (
  id: string | number,
  action: string,
  rowElement: HTMLElement | null,
) => {
  const resolvedId = String(id);
  if (action === "delete") {
    if (confirm("Hapus refund ini?")) {
      deletingId = resolvedId;
      try {
        await trpc.refunds.delete.mutate(resolvedId);
        toastRef?.show("Refund dihapus", "success");
        queryClient.invalidateQueries({ queryKey: ["refunds.list"] });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        toastRef?.show(message, "error");
      } finally {
        deletingId = null;
      }
    }
  } else if (action === "save" && rowElement) {
    const fields: Record<string, string> = {};
    rowElement.querySelectorAll("[data-field]").forEach((el) => {
      const field = el.getAttribute("data-field")!;
      if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
        fields[field] = el.value;
      } else {
        fields[field] = el.textContent?.trim() || "";
      }
    });

    const data = {
      amount: Number(fields.amount),
      status: fields.status,
      reason: fields.reason || undefined,
    };

    savingId = resolvedId;
    try {
      await trpc.refunds.update.mutate({ id: resolvedId, data });
      toastRef?.show("Refund diperbarui", "success");
      queryClient.invalidateQueries({ queryKey: ["refunds.list"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      toastRef?.show(message, "error");
    } finally {
      savingId = null;
    }
  }
};
</script>
<div class="w-full h-full">
<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
<SectionHeader title="Buat Refund" />
<CrudInlineForm
  id="refund-form"
  onsubmit={handleCreate}
  isSubmitting={isSubmitting}
>
  <div
    class="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-stone-100 pb-5 w-full"
  >
    <div class="space-y-1">
      <label
        for="order_no"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Order No</label
      >
      <input
        id="order_no"
        name="order_no"
        required
        class="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold tabular-nums"
      />
    </div>
    <div class="space-y-1">
      <label
        for="amount"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Jumlah (Rp)</label
      >
      <input
        id="amount"
        name="amount"
        type="number"
        required
        class="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm"
      />
    </div>
    <div class="space-y-1">
      <label
        for="status"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Status Awal</label
      >
      <select
        id="status"
        name="status"
        class="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm appearance-none cursor-pointer outline-none font-medium"
      >
        <option value="pending">⏳ Pending</option>
        <option value="processing">🔄 Diproses</option>
        <option value="completed">✅ Selesai</option>
        <option value="failed">❌ Gagal</option>
      </select>
    </div>
    <div class="space-y-1">
      <label
        for="reason"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Alasan</label
      >
      <input
        id="reason"
        name="reason"
        class="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm"
      />
    </div>
  </div>
  <div class="flex items-end mt-4">
    <button
      class="flex items-center justify-center gap-2 h-[38px] px-6 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto mt-auto"
      type="submit"
      disabled={isSubmitting}
    >
      {#if isSubmitting}
        <svg
          class="animate-spin -ml-1 h-3.5 w-3.5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          ><circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle><path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path></svg
        >
      {/if}
      Simpan
    </button>
  </div>
</CrudInlineForm>

<div class="-mt-2 mb-4">
  <StatusBadge label="Dana Keluar" tone="danger" />
</div>

<AdminDataTable>
  <thead>
    <tr>
      <th>Order</th>
      <th>Jumlah</th>
      <th>Status</th>
      <th>Gateway</th>
      <th>Alasan</th>
      <th>Aksi</th>
    </tr>
  </thead>
  <tbody>
    {#if currentRefunds.length === 0}
      <tr>
        <td colspan="6" class="text-center py-12 text-stone-400 text-sm italic">
          {#if isFetching}Memuat data...{:else}Belum ada refund yang sesuai kriteria.{/if}
        </td>
      </tr>
    {/if}
    {#each currentRefunds as row (row.id)}
      <tr
        transition:fade={{ duration: 200 }}
        data-id={row.id}
      >
        <td contenteditable="true" data-field="orderNo">{row.orderNo}</td>
        <td
          contenteditable="true"
          data-field="amount"
          class="py-4 tabular-nums font-mono font-bold text-stone-800 outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all"
          ><span class="text-stone-400 text-xs mr-1 font-sans">Rp</span>{row.amount}</td
        >
        <td class="py-4">
          <select
            data-field="status"
            class="px-3 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white transition-all bg-transparent text-xs font-bold uppercase cursor-pointer outline-none"
          >
            <option value="pending" selected={row.status === "pending"}
              >⏳ Pending</option
            >
            <option value="processing" selected={row.status === "processing"}
              >🔄 Proses</option
            >
            <option value="completed" selected={row.status === "completed"}
              >✅ Selesai</option
            >
            <option value="failed" selected={row.status === "failed"}
              >❌ Gagal</option
            >
          </select>
        </td>
        <td>{row.providerStatus || "-"}</td>
        <td contenteditable="true" data-field="reason">{row.reason || ""}</td>
        <td>
          <RowActions
            isSaving={savingId === row.id}
            isDeleting={deletingId === row.id}
            onSave={(e) =>
              handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
            onDelete={() => handleRowAction(row.id, "delete", null)}
          />
        </td>
      </tr>
    {/each}
  </tbody>
</AdminDataTable>

</div>

<ToastNotification bind:this={toastRef} />


</div>
