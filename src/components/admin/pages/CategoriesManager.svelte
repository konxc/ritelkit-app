<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { collectRowFields } from "../../../lib/admin-client";
  import { onMount } from "svelte";

  type CategoryRow = {
    id: string | number;
    name: string;
    slug: string | null;
    sort_order: number;
    is_active: boolean;
  };

  let { rows }: { rows: CategoryRow[] } = $props();

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
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
        body: data,
      });
      if (!response.ok) {
        toastRef?.show(await response.text(), "error");
        return;
      }
      toastRef?.show("Kategori berhasil ditambahkan!", "success");
      setTimeout(() => location.reload(), 800);
    } catch (err: any) {
      toastRef?.show(err.message || "Kesalahan jaringan", "error");
    } finally {
      isSubmitting = false;
    }
  };

  const handleTableClick = async (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    if (!action) return;
    const row = target.closest("tr[data-id]");
    if (!row) return;
    const id = row.getAttribute("data-id");
    if (!id) return;

    if (action === "delete") {
      if (!confirm("Hapus kategori ini?")) return;

      rowStates[id] = { ...rowStates[id], isDeleting: true };
      rowStates = { ...rowStates };

      try {
        const response = await fetch(`/api/admin/categories/${id}`, {
          method: "DELETE",
          headers: { "X-CSRF-Token": csrfToken },
        });
        if (!response.ok) {
          toastRef?.show(await response.text(), "error");
          rowStates[id] = { ...rowStates[id], isDeleting: false };
          return;
        }
        toastRef?.show("Kategori dihapus", "success");
        setTimeout(() => location.reload(), 800);
      } catch (err: any) {
        toastRef?.show(err.message || "Kesalahan jaringan", "error");
        rowStates[id] = { ...rowStates[id], isDeleting: false };
      }
      return;
    }

    if (action === "save") {
      rowStates[id] = { ...rowStates[id], isSaving: true };
      rowStates = { ...rowStates };

      try {
        const payload = collectRowFields(row);
        const response = await fetch(`/api/admin/categories/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          toastRef?.show(await response.text(), "error");
          rowStates[id] = { ...rowStates[id], isSaving: false };
          return;
        }
        toastRef?.show("Kategori diperbarui", "success");
        setTimeout(() => location.reload(), 800);
      } catch (err: any) {
        toastRef?.show(err.message || "Kesalahan jaringan", "error");
        rowStates[id] = { ...rowStates[id], isSaving: false };
      }
    }
  };
</script>

<SectionHeader title="Tambah Kategori" badge="Kelola menu" />
<CrudInlineForm id="category-form" on:submit={handleCreate} {isSubmitting}>
  <div
    class="flex flex-col md:flex-row gap-4 xl:gap-6 items-end pb-8 border-b border-stone-100 mb-8 w-full"
  >
    <div class="space-y-1.5 w-full md:flex-1">
      <label
        for="name"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Nama Kategori</label
      >
      <input
        id="name"
        name="name"
        required
        placeholder="Cth: Menu Baru"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
      />
    </div>
    <div class="space-y-1.5 w-full md:flex-1">
      <label
        for="slug"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Slug</label
      >
      <input
        id="slug"
        name="slug"
        placeholder="kosongkan untuk auto"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
      />
    </div>
    <div class="space-y-1.5 w-full md:w-32 shrink-0">
      <label
        for="sort_order"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Urutan</label
      >
      <input
        id="sort_order"
        name="sort_order"
        type="number"
        value="0"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
      />
    </div>
    <div class="space-y-1.5 w-full md:w-40 shrink-0">
      <label
        for="is_active"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Status</label
      >
      <select
        id="is_active"
        name="is_active"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none appearance-none cursor-pointer"
      >
        <option value="true">Aktif</option>
        <option value="false">Nonaktif / Draft</option>
      </select>
    </div>
    <button
      class="flex items-center justify-center gap-2 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
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
      Tambah Kategori
    </button>
  </div>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Kategori" muted="Klik sel untuk edit" />
</div>
<div
  role="button"
  tabindex="0"
  onclick={handleTableClick}
  onkeydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  }}
>
  <AdminDataTable class="mt-4">
    <thead>
      <tr>
        <th>Nama</th>
        <th>Slug</th>
        <th>Urutan</th>
        <th>Status</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#if rows.length === 0}
        <tr>
          <td colspan="5" class="text-center py-8 text-stone-400 text-sm"
            >Belum ada kategori terdaftar</td
          >
        </tr>
      {/if}
      {#each rows as row (row.id)}
        <tr
          data-id={row.id}
          class="group hover:bg-stone-50/50 transition-colors"
        >
          <td
            contenteditable="true"
            data-field="name"
            class="font-medium text-stone-900 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-3 py-1.5 rounded-lg border border-transparent transition-all"
            >{row.name}</td
          >
          <td
            contenteditable="true"
            data-field="slug"
            class="font-mono text-xs text-stone-500 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-3 py-1.5 rounded-lg border border-transparent transition-all"
            >{row.slug || ""}</td
          >
          <td
            contenteditable="true"
            data-field="sort_order"
            class="tabular-nums font-medium text-stone-700 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-3 py-1.5 rounded-lg border border-transparent transition-all w-24 text-center"
            >{row.sort_order}</td
          >
          <td>
            <select
              data-field="is_active"
              class="px-3 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-transparent text-sm cursor-pointer outline-none"
            >
              <option value="true" selected={row.is_active}>Aktif</option>
              <option value="false" selected={!row.is_active}>Draft</option>
            </select>
          </td>
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
