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
let isDrawerOpen = $state(false);

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
		isDrawerOpen = false;
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
<div class="flex items-center justify-between mt-2 mb-8">
  <SectionHeader title="Daftar Kategori" muted="Kelola dan edit kategori produk" />
  <button
    class="flex items-center gap-2 px-4 py-2 bg-stone-900 border border-transparent rounded-xl text-white text-[0.85rem] font-bold shadow-sm hover:bg-stone-800 transition-all hover:shadow-md"
    onclick={() => isDrawerOpen = true}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
    Tambah Kategori
  </button>
</div>

{#if isDrawerOpen}
<div class="fixed inset-0 z-[100] flex justify-end">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
    transition:fade={{duration: 200}} 
    onclick={() => isDrawerOpen = false}
  ></div>
  
  <div class="relative w-full max-w-md bg-white border-l border-stone-100 h-full shadow-2xl flex flex-col z-[101]" transition:fly={{x: 400, opacity: 1, duration: 300}}>
    <div class="flex items-center justify-between px-6 py-5 border-b border-stone-100 bg-stone-50/50">
      <div>
        <h3 class="font-bold text-stone-800 text-lg">Tambah Kategori</h3>
        <p class="text-xs font-semibold text-stone-400 mt-0.5 uppercase tracking-wider">Product Organization</p>
      </div>
      <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 text-stone-500 transition-colors" onclick={() => isDrawerOpen = false}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto w-full">
      <CrudInlineForm
        id="category-form"
        onsubmit={categoryFormHandler}
        isSubmitting={isSubmitting}
      >
        <div class="p-6 space-y-6">
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
              class="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm placeholder:text-stone-300 shadow-sm"
            />
          </div>
          <div class="space-y-1.5">
            <label
              for="slug"
              class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
              >URL Slug</label
            >
            <input
              name="slug"
              id="slug"
              bind:value={newSlug}
              placeholder="roti-manis"
              class="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-stone-50 text-sm placeholder:text-stone-300 shadow-sm font-mono text-stone-600"
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
              class="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm shadow-sm tabular-nums"
            />
          </div>
          <div class="space-y-1.5">
            <label
              for="isActive"
              class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
              >Status Visibilitas</label
            >
            <select
              name="isActive"
              id="isActive"
              class="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm shadow-sm cursor-pointer font-medium appearance-none"
            >
              <option value="true">🟢 Aktif (Publik)</option>
              <option value="false">🔴 Draft (Tersembunyi)</option>
            </select>
          </div>
        </div>
        <div class="p-6 pt-2 border-t border-stone-100 bg-stone-50/30 mt-auto">
          <button
            class="flex items-center justify-center gap-2 h-[46px] rounded-xl bg-gradient-to-r from-[#c48a3a] to-[#a6722d] text-white text-sm font-bold hover:shadow-[0_4px_12px_rgba(196,138,58,0.25)] hover:-translate-y-0.5 transition-all shadow-md w-full disabled:opacity-70 disabled:cursor-not-allowed"
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
            Simpan Kategori Baru
          </button>
        </div>
      </CrudInlineForm>
    </div>
  </div>
</div>
{/if}

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
              class="outline-none px-3 py-1.5 rounded-lg bg-stone-100/60 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all font-bold text-stone-900 border border-stone-200/50 hover:border-[#c48a3a]/30 inline-block min-w-[120px]"
            >
              {row.name}
            </div>
          </td>
          <td class="py-4">
            <div
              contenteditable="true"
              data-field="slug"
              class="outline-none px-3 py-1.5 rounded-lg bg-stone-100/60 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all font-mono text-[0.8rem] text-stone-500 border border-stone-200/50 hover:border-[#c48a3a]/30 inline-block min-w-[120px]"
            >
              {row.slug || ""}
            </div>
          </td>
          <td class="py-4">
            <div
              contenteditable="true"
              data-field="sortOrder"
              class="outline-none px-3 py-1.5 rounded-lg bg-stone-100/60 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all font-bold text-stone-600 border border-stone-200/50 hover:border-[#c48a3a]/30 inline-block w-16 text-center tabular-nums"
            >
              {row.sortOrder}
            </div>
          </td>
          <td class="py-4">
            <select
              data-field="isActive"
              class="outline-none px-3 py-1.5 rounded-lg border border-stone-200/50 bg-stone-100/60 hover:bg-white hover:border-[#c48a3a]/30 focus:bg-white transition-all cursor-pointer font-bold text-[0.7rem] uppercase tracking-wider text-stone-700"
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
<ToastNotification bind:this={toastRef} />
