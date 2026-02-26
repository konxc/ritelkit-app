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
  import { onMount } from "svelte";

  // -- type definition ...

  let { rows = [] }: { rows: RefundRow[] } = $props();

  let csrfToken = "";
  let isSubmitting = $state(false);
  let rowStates = $state<
    Record<string, { isSaving?: boolean; isDeleting?: boolean }>
  >({});
  let toastRef: ToastNotification;

  onMount(() => {
    csrfToken =
      document
        .querySelector("meta[name='csrf-token']")
        ?.getAttribute("content") || "";
  });

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;

    isSubmitting = true;
    try {
      const data = new FormData(form);
      const response = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
        body: data,
      });
      if (!response.ok) {
        toastRef?.show(await response.text(), "error");
        return;
      }
      toastRef?.show("Refund berhasil ditambah!", "success");
      setTimeout(() => location.reload(), 800);
    } catch (err: any) {
      toastRef?.show(err.message || "Kesalahan jaringan", "error");
    } finally {
      isSubmitting = false;
    }
  };

  const handleRowAction = async (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    if (!action) return;
    const row = target.closest("tr[data-id]");
    if (!row) return;
    const id = row.getAttribute("data-id");
    if (!id) return;

    if (action === "delete") {
      if (!confirm("Hapus refund ini?")) return;

      rowStates[id] = { ...rowStates[id], isDeleting: true };

      try {
        const response = await fetch(`/api/admin/refunds/${id}`, {
          method: "DELETE",
          headers: { "X-CSRF-Token": csrfToken },
        });
        if (!response.ok) {
          toastRef?.show(await response.text(), "error");
          rowStates[id] = { ...rowStates[id], isDeleting: false };
          return;
        }
        toastRef?.show("Refund dihapus", "success");
        setTimeout(() => location.reload(), 800);
      } catch (err: any) {
        toastRef?.show(err.message || "Kesalahan jaringan", "error");
        rowStates[id] = { ...rowStates[id], isDeleting: false };
      }
      return;
    }

    if (action === "save") {
      rowStates[id] = { ...rowStates[id], isSaving: true };

      try {
        const fields: Record<string, string> = {};
        row.querySelectorAll("[data-field]").forEach((cell) => {
          const field = cell.getAttribute("data-field");
          if (!field) return;
          if (
            cell instanceof HTMLSelectElement ||
            cell instanceof HTMLInputElement
          ) {
            fields[field] = String(cell.value);
            return;
          }
          fields[field] = String(cell.textContent?.trim() || "");
        });
        const response = await fetch(`/api/admin/refunds/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(fields),
        });
        if (!response.ok) {
          toastRef?.show(await response.text(), "error");
          rowStates[id] = { ...rowStates[id], isSaving: false };
          return;
        }
        toastRef?.show("Refund diperbarui", "success");
        setTimeout(() => location.reload(), 800);
      } catch (err: any) {
        toastRef?.show(err.message || "Kesalahan jaringan", "error");
        rowStates[id] = { ...rowStates[id], isSaving: false };
      }
    }
  };
</script>

<SectionHeader title="Buat Refund" />
<CrudInlineForm id="refund-form" on:submit={handleCreate} {isSubmitting}>
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

<div
  role="button"
  tabindex="0"
  onclick={handleRowAction}
  onkeydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  }}
>
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
      {#each rows as row (row.id)}
        <tr data-id={row.id}>
          <td contenteditable="true" data-field="order_no">{row.order_no}</td>
          <td contenteditable="true" data-field="amount">{row.amount}</td>
          <td contenteditable="true" data-field="status">{row.status}</td>
          <td>{row.provider_status || "-"}</td>
          <td contenteditable="true" data-field="reason">{row.reason || ""}</td>
          <td>
            <RowActions
              isSaving={rowStates[row.id]?.isSaving}
              isDeleting={rowStates[row.id]?.isDeleting}
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>

<ToastNotification bind:this={toastRef} />
