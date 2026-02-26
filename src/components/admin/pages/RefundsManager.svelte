<script module lang="ts">
  export type RefundRow = {
    id: string | number;
    order_no: string;
    amount: number;
    status: string;
    provider_status?: string | null;
    reason?: string | null;
  };
</script>

<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import StatusBadge from "../StatusBadge.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { trpc } from "../../../lib/trpc";
  import {
    createQuery,
    createMutation,
    useQueryClient,
  } from "@tanstack/svelte-query";

  let { rows: initialRows = [] }: { rows: any[] } = $props();

  const queryClient = useQueryClient();
  let toastRef = $state<ToastNotification>();

  const refundsQuery = createQuery({
    queryKey: ["refunds"],
    queryFn: () => trpc.refunds.list.query(),
    initialData: () => initialRows,
  });

  const createRefundMutation = createMutation({
    mutationFn: (data: any) => trpc.refunds.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      toastRef?.show("Refund berhasil ditambah!", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const updateRefundMutation = createMutation({
    mutationFn: (payload: { id: string; data: any }) =>
      trpc.refunds.update.mutate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      toastRef?.show("Refund diperbarui", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const deleteRefundMutation = createMutation({
    mutationFn: (id: string) => trpc.refunds.delete.mutate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      toastRef?.show("Refund dihapus", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    createRefundMutation.mutate({
      orderNo: data.get("order_no") as string,
      amount: Number(data.get("amount")),
      status: data.get("status") as string,
      reason: data.get("reason") as string,
    });
    form.reset();
  };

  const handleRowAction = (
    id: string,
    action: string,
    rowElement: HTMLElement | null,
  ) => {
    if (action === "delete") {
      if (confirm("Hapus refund ini?")) {
        deleteRefundMutation.mutate(id);
      }
    } else if (action === "save" && rowElement) {
      const fields: Record<string, any> = {};
      rowElement.querySelectorAll("[data-field]").forEach((el) => {
        const field = el.getAttribute("data-field")!;
        if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
          fields[field] = el.value;
        } else {
          fields[field] = el.textContent?.trim();
        }
      });

      const data = {
        orderNo: fields.orderNo,
        amount: Number(fields.amount),
        status: fields.status,
        reason: fields.reason,
      };

      updateRefundMutation.mutate({ id, data });
    }
  };

  const currentRefunds = $derived($refundsQuery.data || initialRows);
</script>

<SectionHeader title="Buat Refund" />
<CrudInlineForm
  id="refund-form"
  on:submit={handleCreate}
  isSubmitting={$createRefundMutation.isPending}
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
        class="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm"
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
        >Status</label
      >
      <select
        id="status"
        name="status"
        class="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm appearance-none cursor-pointer"
      >
        <option value="requested">Requested</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
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
      disabled={$createRefundMutation.isPending}
    >
      {#if $createRefundMutation.isPending}
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
    {#each currentRefunds as row (row.id)}
      <tr data-id={row.id}>
        <td contenteditable="true" data-field="orderNo">{row.orderNo}</td>
        <td contenteditable="true" data-field="amount">{row.amount}</td>
        <td class="py-4">
          <select
            data-field="status"
            class="px-3 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white transition-all bg-transparent text-xs font-bold uppercase cursor-pointer outline-none"
          >
            <option value="requested" selected={row.status === "requested"}
              >Requested</option
            >
            <option value="approved" selected={row.status === "approved"}
              >Approved</option
            >
            <option value="rejected" selected={row.status === "rejected"}
              >Rejected</option
            >
          </select>
        </td>
        <td>{row.providerStatus || "-"}</td>
        <td contenteditable="true" data-field="reason">{row.reason || ""}</td>
        <td>
          <RowActions
            isSaving={$updateRefundMutation.isPending &&
              $updateRefundMutation.variables?.id === row.id}
            isDeleting={$deleteRefundMutation.isPending &&
              $deleteRefundMutation.variables === row.id}
            onSave={(e) =>
              handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
            onDelete={() => handleRowAction(row.id, "delete", null)}
          />
        </td>
      </tr>
    {/each}
  </tbody>
</AdminDataTable>

<ToastNotification bind:this={toastRef} />
