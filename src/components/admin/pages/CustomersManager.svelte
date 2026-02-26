<script module lang="ts">
  export type CustomerRow = {
    id: string | number;
    name: string;
    phone: string;
    email?: string | null;
    notes?: string | null;
  };
</script>

<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import RowActions from "../RowActions.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { onMount } from "svelte";

  let { rows = [] }: { rows: CustomerRow[] } = $props();

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
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
        body: data,
      });
      if (!response.ok) {
        toastRef?.show(await response.text(), "error");
        return;
      }
      toastRef?.show("Pelanggan berhasil ditambahkan!", "success");
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
    const id = row.getAttribute("data:id") || row.getAttribute("data-id");
    if (!id) return;

    if (action === "delete") {
      if (!confirm("Hapus pelanggan ini?")) return;

      rowStates[id] = { ...rowStates[id], isDeleting: true };

      try {
        const response = await fetch(`/api/admin/customers/${id}`, {
          method: "DELETE",
          headers: { "X-CSRF-Token": csrfToken },
        });
        if (!response.ok) {
          toastRef?.show(await response.text(), "error");
          rowStates[id] = { ...rowStates[id], isDeleting: false };
          return;
        }
        toastRef?.show("Pelanggan dihapus", "success");
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
        const response = await fetch(`/api/admin/customers/${id}`, {
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
        toastRef?.show("Pelanggan diperbarui", "success");
        setTimeout(() => location.reload(), 800);
      } catch (err: any) {
        toastRef?.show(err.message || "Kesalahan jaringan", "error");
        rowStates[id] = { ...rowStates[id], isSaving: false };
      }
    }
  };
</script>

<SectionHeader title="Tambah Pelanggan" badge="CRM" />
<CrudInlineForm id="customer-form" on:submit={handleCreate} {isSubmitting}>
  <div
    class="flex flex-col md:flex-row flex-wrap gap-4 xl:gap-6 items-end pb-8 border-b border-stone-100 mb-8 w-full"
  >
    <div class="space-y-1.5 w-full md:w-64">
      <label
        for="name"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Nama Lengkap</label
      >
      <input
        id="name"
        name="name"
        required
        placeholder="Cth: Budi Santoso"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold"
      />
    </div>
    <div class="space-y-1.5 w-full md:w-48">
      <label
        for="phone"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >No. WhatsApp</label
      >
      <input
        id="phone"
        name="phone"
        required
        placeholder="0812..."
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-mono"
      />
    </div>
    <div class="space-y-1.5 w-full md:w-64">
      <label
        for="email"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Email (Opsional)</label
      >
      <input
        id="email"
        name="email"
        type="email"
        placeholder="budi@email.com"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
      />
    </div>
    <div class="space-y-1.5 w-full md:flex-1">
      <label
        for="notes"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Catatan</label
      >
      <input
        id="notes"
        name="notes"
        placeholder="Info tambahan pelanggan..."
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
      />
    </div>
    <button
      class="flex items-center justify-center gap-3 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
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
      Tambah Data
    </button>
  </div>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Pelanggan" muted="Cari detail lalu klik" />
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
        <th>Nama</th>
        <th>Telepon</th>
        <th>Email</th>
        <th>Catatan</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#if rows.length === 0}
        <tr>
          <td
            colspan="5"
            class="text-center py-12 text-stone-400 text-sm italic"
            >Belum ada data pelanggan.</td
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
            data-field="phone"
            class="py-4 font-mono text-[#c48a3a] font-bold outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all"
            >{row.phone}</td
          >
          <td
            contenteditable="true"
            data-field="email"
            class="py-4 text-stone-600 outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all"
            >{row.email || "-"}</td
          >
          <td
            contenteditable="true"
            data-field="notes"
            class="py-4 text-stone-500 text-sm italic outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all"
            >{row.notes || "-"}</td
          >
          <td class="py-4">
            <RowActions
              detailHref={`/admin/customers/${row.id}`}
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
