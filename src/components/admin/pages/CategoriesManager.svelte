<script lang="ts">
import { trpc } from "../../../lib/trpc";
import { fade, fly } from "svelte/transition";
import { createQuery, useQueryClient } from "@tanstack/svelte-query";
import type { Category } from "../../../lib/types";
import AdminDataTable from "../AdminDataTable.svelte";
import CrudInlineForm from "../CrudInlineForm.svelte";
import RowActions from "../RowActions.svelte";
import SectionHeader from "../SectionHeader.svelte";
import ToastNotification from "../ToastNotification.svelte";

type CategoryMutationInput = {
	name: string;
	slug: string;
	isActive: number;
	sortOrder?: number;
};

let { rows: initialRows = [] }: { rows?: Category[] } = $props();

const queryClient = useQueryClient();
let toastRef = $state<ToastNotification>();
let newName = $state("");
let newSlug = $state("");
let isSubmitting = $state(false);
let processingId = $state<string | null>(null);

const categoriesQuery = createQuery(() => ({
	queryKey: ["categories.list"],
	queryFn: () => trpc.categories.list.query(),
	initialData: initialRows.length > 0 ? initialRows : undefined,
	refetchOnMount: false,
	staleTime: 1000 * 60 * 5,
}));

let categories = $derived((categoriesQuery.data as Category[]) || initialRows);

$effect(() => {
	if (newName) {
		newSlug = newName
			.toLowerCase()
			.replace(/ /g, "-")
			.replace(/[^\w-]+/g, "");
	}
});

const categoryFormHandler = async (event: SubmitEvent) => {
	event.preventDefault();
	const form = event.currentTarget as HTMLFormElement;
	const formData = new FormData(form);
	const payload: CategoryMutationInput = {
		name: formData.get("name") as string,
		slug: formData.get("slug") as string,
		sortOrder: Number(formData.get("sort_order") || 0),
		isActive: formData.get("isActive") === "true" ? 1 : 0,
	};

	isSubmitting = true;
	try {
		await trpc.categories.create.mutate(payload);
		queryClient.invalidateQueries({ queryKey: ["categories.list"] });
		toastRef?.show("Kategori ditambahkan", "success");
		form.reset();
		newName = "";
		newSlug = "";
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Gagal menambah kategori";
		toastRef?.show(message, "error");
	} finally {
		isSubmitting = false;
	}
};

const handleRowAction = async (
	id: string,
	action: "save" | "delete",
	rowEl: HTMLElement,
) => {
	if (action === "delete") {
		if (!confirm("Hapus kategori ini?")) return;
		processingId = id;
		try {
			await trpc.categories.delete.mutate(id);
			queryClient.invalidateQueries({ queryKey: ["categories.list"] });
			toastRef?.show("Kategori dihapus", "success");
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Gagal menghapus kategori";
			toastRef?.show(message, "error");
		} finally {
			processingId = null;
		}
		return;
	}

	if (action === "save") {
		const payload: Record<string, string | number> = {};
		rowEl.querySelectorAll("[data-field]").forEach((cell) => {
			const field = cell.getAttribute("data-field");
			if (!field) return;
			if (cell instanceof HTMLSelectElement) {
				payload[field] = cell.value === "true" ? 1 : 0;
			} else if (cell instanceof HTMLInputElement) {
				payload[field] = cell.value;
			} else {
				payload[field] = cell.textContent?.trim() || "";
			}
		});

		if (payload.sortOrder) payload.sortOrder = Number(payload.sortOrder);

		processingId = id;
		try {
			await trpc.categories.update.mutate({
				id,
				data: payload as Partial<CategoryMutationInput>,
			});
			queryClient.invalidateQueries({ queryKey: ["categories.list"] });
			toastRef?.show("Kategori diperbarui", "success");
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Gagal memperbarui kategori";
			toastRef?.show(message, "error");
		} finally {
			processingId = null;
		}
	}
};
</script>
<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
<SectionHeader title="Tambah Kategori" badge="Product Organization" />
<CrudInlineForm
  id="category-form"
  onsubmit={categoryFormHandler}
  isSubmitting={isSubmitting}
>
<div class="space-y-6 border-b border-stone-100 pb-8 mb-8">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="space-y-1.5">
      <label
        for="name"
        class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
        >Nama Kategori</label
      >
      <input
        name="name"
        id="name"
        required
        bind:value={newName}
        placeholder="Cth: Roti Manis"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm placeholder:text-stone-300 shadow-sm"
      />
    </div>
    <div class="space-y-1.5">
      <label
        for="slug"
        class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
        >Slug</label
      >
      <input
        name="slug"
        id="slug"
        bind:value={newSlug}
        placeholder="roti-manis"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-stone-50 text-sm placeholder:text-stone-300 shadow-sm font-mono text-stone-600"
      />
    </div>
    <div class="space-y-1.5">
      <label
        for="sort_order"
        class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
        >Urutan (Prioritas)</label
      >
      <input
        name="sort_order"
        id="sort_order"
        type="number"
        value="0"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm shadow-sm tabular-nums"
      />
    </div>
    <div class="space-y-1.5">
      <label
        for="isActive"
        class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
        >Status</label
      >
      <select
        name="isActive"
        id="isActive"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm shadow-sm cursor-pointer font-medium appearance-none"
      >
        <option value="true">🟢 Aktif (Publik)</option>
        <option value="false">🔴 Draft (Tersembunyi)</option>
      </select>
    </div>
  </div>
  <div class="flex items-center justify-end pt-2">
    <button
      class="flex items-center justify-center gap-2 h-[42px] px-8 rounded-xl bg-gradient-to-r from-[#c48a3a] to-[#a6722d] text-white text-sm font-bold hover:shadow-[0_4px_12px_rgba(196,138,58,0.25)] hover:-translate-y-0.5 transition-all shadow-md w-full sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
      type="submit"
      disabled={isSubmitting}
    >
      {#if isSubmitting}
        <svg class="animate-spin h-4 w-4 mr-1 inline" viewBox="0 0 24 24"
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
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      {/if}
      Tambah Kategori Baru
    </button>
  </div>
</div>
</CrudInlineForm>

<div class="mt-8">
  <SectionHeader title="Daftar Kategori" muted="Edit langsung di tabel" />
  <AdminDataTable>
    <thead>
      <tr>
        <th>Kategori</th>
        <th>URL Slug</th>
        <th>Urutan</th>
        <th>Visibilitas</th>
        <th class="text-right">Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#if categories.length === 0}
        <tr>
          <td colspan="5" class="py-12">
            <div class="flex flex-col items-center justify-center text-center">
              <div class="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mb-3 border border-stone-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
              </div>
              <p class="text-sm font-bold text-stone-900 mb-1">Daftar Kategori Kosong</p>
              <p class="text-xs text-stone-500 max-w-[200px]">Belum ada kategori yang dibuat. Gunakan form di atas untuk menambahkannya.</p>
            </div>
          </td>
        </tr>
      {/if}
      {#each categories as row (row.id)}
        <tr
          transition:fade={{ duration: 200 }}
          data-id={row.id}
          class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
        >
          <td class="py-4">
            <div
              contenteditable="true"
              data-field="name"
              class="outline-none px-3 py-1.5 rounded-lg hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all font-bold text-stone-900 border border-transparent"
            >
              {row.name}
            </div>
          </td>
          <td class="py-4">
            <div
              contenteditable="true"
              data-field="slug"
              class="outline-none px-3 py-1.5 rounded-lg hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all font-mono text-[0.8rem] text-stone-500 border border-transparent"
            >
              {row.slug || ""}
            </div>
          </td>
          <td class="py-4">
            <div
              contenteditable="true"
              data-field="sortOrder"
              class="outline-none px-3 py-1.5 rounded-lg hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all font-bold text-stone-600 text-center border border-transparent w-16"
            >
              {row.sortOrder}
            </div>
          </td>
          <td class="py-4">
            <select
              data-field="isActive"
              class="outline-none px-3 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white bg-transparent transition-all cursor-pointer font-bold text-xs"
            >
              <option value="true" selected={row.isActive === 1}>🟢 AKTIF</option>
              <option value="false" selected={row.isActive === 0}>🔴 DRAFT</option>
            </select>
          </td>
          <td class="py-4 pr-4">
            <div class="flex justify-end">
              <RowActions
                isSaving={processingId === row.id}
                isDeleting={processingId === row.id}
                onSave={(e) =>
                  handleRowAction(row.id, "save", e.currentTarget.closest("tr")!)}
                onDelete={() => handleRowAction(row.id, "delete", null!)}
              />
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>
</div>

<ToastNotification bind:this={toastRef} />
