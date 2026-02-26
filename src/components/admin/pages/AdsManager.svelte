<script module lang="ts">
  export type AdRow = {
    id: string | number;
    name: string;
    channel: string;
    budget: number;
    spend: number;
    status: string;
  };
</script>

<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { onMount } from "svelte";

  // ... AdRow definition ...

  let { rows = [] }: { rows: AdRow[] } = $props();

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
      const response = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
        body: data,
      });
      if (!response.ok) {
        toastRef?.show(await response.text(), "error");
        return;
      }
      toastRef?.show("Campaign berhasil dibuat!", "success");
      setTimeout(() => location.reload(), 800);
    } catch (err: any) {
      toastRef?.show(err.message || "Kesalahan jaringan", "error");
    } finally {
      isSubmitting = false;
    }
  };

  const handleRowClick = async (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    if (!action) return;
    const row = target.closest("tr[data-id]");
    if (!row) return;
    const id = row.getAttribute("data-id");
    if (!id) return;

    if (action === "delete") {
      if (!confirm("Hapus campaign ini?")) return;

      rowStates[id] = { ...rowStates[id], isDeleting: true };

      try {
        const response = await fetch(`/api/admin/ads/${id}`, {
          method: "DELETE",
          headers: { "X-CSRF-Token": csrfToken },
        });
        if (!response.ok) {
          toastRef?.show(await response.text(), "error");
          rowStates[id] = { ...rowStates[id], isDeleting: false };
          return;
        }
        toastRef?.show("Campaign dihapus", "success");
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
          fields[field] = String(cell.textContent?.trim() || "");
        });
        const response = await fetch(`/api/admin/ads/${id}`, {
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
        toastRef?.show("Campaign diperbarui", "success");
        setTimeout(() => location.reload(), 800);
      } catch (err: any) {
        toastRef?.show(err.message || "Kesalahan jaringan", "error");
        rowStates[id] = { ...rowStates[id], isSaving: false };
      }
    }
  };
</script>

<SectionHeader title="Buat Campaign" badge="Ads" />
<CrudInlineForm id="ads-form" on:submit={handleCreate} {isSubmitting}>
  <div class="space-y-6 border-b border-stone-100 pb-8 mb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="space-y-1.5">
        <label
          for="name"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Nama Campaign</label
        >
        <input
          id="name"
          name="name"
          required
          placeholder="Cth: Promo Ramadhan"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="channel"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Channel / Platform</label
        >
        <input
          id="channel"
          name="channel"
          placeholder="IG / FB / Google Ads"
          required
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="budget"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Budget Total (Rp)</label
        >
        <input
          id="budget"
          name="budget"
          type="number"
          required
          placeholder="0"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold tabular-nums"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="status"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Status Awal</label
        >
        <select
          id="status"
          name="status"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none appearance-none cursor-pointer font-medium"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div class="space-y-1.5">
        <label
          for="start_at"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Tanggal Mulai</label
        >
        <input
          id="start_at"
          name="start_at"
          type="date"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="end_at"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Tanggal Selesai</label
        >
        <input
          id="end_at"
          name="end_at"
          type="date"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <div class="space-y-1.5 col-span-1 md:col-span-2">
        <label
          for="notes"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Catatan Campaign</label
        >
        <input
          id="notes"
          name="notes"
          placeholder="Tujuan campaign, link kreatif, dll..."
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
    </div>
  </div>
  <div class="flex items-end mt-4">
    <button
      class="flex items-center justify-center gap-3 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto mt-auto"
      type="submit"
      disabled={isSubmitting}
    >
      {#if isSubmitting}
        <svg
          class="animate-spin -ml-1 mr-1 h-4 w-4 text-white inline-block"
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
      Luncurkan Campaign
    </button>
  </div>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Campaign" />
</div>
<div
  role="button"
  tabindex="0"
  onclick={handleRowClick}
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
        <th>Nama</th>
        <th>Channel</th>
        <th>Budget</th>
        <th>Spend</th>
        <th>Status</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#if rows.length === 0}
        <tr>
          <td
            colspan="6"
            class="text-center py-12 text-stone-400 text-sm italic"
            >Belum ada campaign beriklan.</td
          >
        </tr>
      {/if}
      {#each rows as row (row.id)}
        <tr
          data-id={row.id}
          class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
        >
          <td
            contenteditable="true"
            data-field="name"
            class="py-4 font-bold text-stone-900 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-3 py-1.5 rounded-lg border border-transparent transition-all"
            >{row.name}</td
          >
          <td
            contenteditable="true"
            data-field="channel"
            class="py-4 font-medium text-stone-500 uppercase tracking-widest text-[0.65rem] outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all"
            >{row.channel}</td
          >
          <td
            contenteditable="true"
            data-field="budget"
            class="py-4 tabular-nums font-bold text-stone-800 outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all w-32 text-center text-sm"
            >{row.budget}</td
          >
          <td
            contenteditable="true"
            data-field="spend"
            class="py-4 tabular-nums font-bold text-rose-600 outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all w-32 text-center text-sm"
            >{row.spend}</td
          >
          <td class="py-4">
            <select
              data-field="status"
              class="px-3 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white transition-all bg-transparent text-xs font-bold uppercase cursor-pointer outline-none"
            >
              <option value="draft" selected={row.status === "draft"}
                >Draft</option
              >
              <option value="active" selected={row.status === "active"}
                >🟢 Active</option
              >
              <option value="paused" selected={row.status === "paused"}
                >🟡 Paused</option
              >
              <option value="completed" selected={row.status === "completed"}
                >⚪ Completed</option
              >
            </select>
          </td>
          <td class="py-4">
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
