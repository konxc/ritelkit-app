<script lang="ts">
import { trpc } from "../../../lib/trpc";
import { fade, fly } from "svelte/transition";
import { createQuery, useQueryClient } from "@tanstack/svelte-query";
import { onMount } from "svelte";
import type { Product } from "../../../lib/types";
import { parseUrls, uploadFiles } from "../../../lib/upload-utils";
import AdminDataTable from "../AdminDataTable.svelte";
import CrudInlineForm from "../CrudInlineForm.svelte";
import ImageGallery from "../ImageGallery.svelte";
import RowActions from "../RowActions.svelte";
import SectionHeader from "../SectionHeader.svelte";
import ToastNotification from "../ToastNotification.svelte";

type ProductRow = Pick<
	Product,
	| "id"
	| "name"
	| "sku"
	| "price"
	| "stock"
	| "isActive"
	| "categoryId"
	| "slug"
	| "description"
	| "imagesJson"
> & {
	categoryName?: string | null;
};

type CategoryOption = { id: string | number; name: string };
type ProductMutationInput = {
	name: string;
	slug: string;
	description?: string | null;
	categoryId?: string | null;
	price: number;
	cost?: number | null;
	stock?: number | null;
	isActive: number;
	imagesJson?: string | null;
};

let {
	rows: initialRows = [],
	categories = [],
}: {
	rows?: ProductRow[];
	categories?: CategoryOption[];
} = $props();

const queryClient = useQueryClient();
let isMutating = $state(false);

let csrfToken = "";
let toastRef: ToastNotification;

onMount(() => {
	csrfToken =
		document
			.querySelector("meta[name='csrf-token']")
			?.getAttribute("content") || "";
});

const productsQuery = createQuery(() => ({
	queryKey: ["products.list"],
	queryFn: () => trpc.products.list.query(),
	initialData: initialRows.length > 0 ? initialRows as any : undefined,
	refetchOnMount: false,
	staleTime: 1000 * 60 * 5,
}));

let currentRows = $derived((productsQuery.data as ProductRow[]) || initialRows);

const handleCreate = async (payload: ProductMutationInput) => {
	isMutating = true;
	try {
		await trpc.products.create.mutate(payload);
		queryClient.invalidateQueries({ queryKey: ["products.list"] });
		toastRef?.show("Produk berhasil ditambahkan!", "success");
		return true;
	} catch (err: any) {
		toastRef?.show(err.message || "Gagal menambah produk", "error");
		return false;
	} finally {
		isMutating = false;
	}
};

const handleUpdate = async (
	id: string,
	data: Partial<ProductMutationInput>,
) => {
	isMutating = true;
	try {
		await trpc.products.update.mutate({ id, data });
		queryClient.invalidateQueries({ queryKey: ["products.list"] });
		toastRef?.show("Produk diperbarui", "success");
	} catch (err: any) {
		toastRef?.show(err.message || "Gagal memperbarui produk", "error");
	} finally {
		isMutating = false;
	}
};

const handleDelete = async (id: string) => {
	if (!confirm("Hapus produk ini?")) return;
	isMutating = true;
	try {
		await trpc.products.delete.mutate(id);
		queryClient.invalidateQueries({ queryKey: ["products.list"] });
		toastRef?.show("Produk dihapus", "success");
	} catch (err: any) {
		toastRef?.show(err.message || "Gagal menghapus produk", "error");
	} finally {
		isMutating = false;
	}
};

let newImageUrls = $state<string[]>([]);
let uploadStatus = $state("");
let newName = $state("");
let newSlug = $derived(
	newName
		.toLowerCase()
		.trim()
		.replace(/ /g, "-")
		.replace(/[^\w-]+/g, ""),
);

const handleFileUpload = async (event: Event) => {
	const input = event.target as HTMLInputElement;
	if (!input.files?.length) return;
	try {
		uploadStatus = "Mengupload...";
		const urls = await uploadFiles(input.files, csrfToken);
		newImageUrls = [...newImageUrls, ...urls];
		uploadStatus = "";
	} catch (err: any) {
		toastRef?.show(err.message, "error");
		uploadStatus = "Gagal upload";
	}
};

const handleDrop = async (event: DragEvent) => {
	event.preventDefault();
	const files = event.dataTransfer?.files;
	if (!files?.length) return;
	try {
		uploadStatus = "Mengupload...";
		const urls = await uploadFiles(files, csrfToken);
		newImageUrls = [...newImageUrls, ...urls];
		uploadStatus = "";
	} catch (err: any) {
		toastRef?.show(err.message, "error");
		uploadStatus = "Gagal upload";
	}
};

const productFormHandler = async (event: SubmitEvent) => {
	event.preventDefault();
	const form = event.currentTarget as HTMLFormElement;
	const formData = new FormData(form);

	const payload = {
		name: String(formData.get("name") || ""),
		sku: String(formData.get("sku") || "") || null,
		categoryId: String(formData.get("categoryId") || "") || null,
		price: Number(formData.get("price") || 0),
		stock: formData.get("stock") ? Number(formData.get("stock")) : null,
		isActive: formData.get("isActive") === "true" ? 1 : 0,
		description: String(formData.get("description") || "") || null,
		imagesJson: JSON.stringify(newImageUrls),
		slug: newSlug || `item-${Date.now()}`,
	};

	const ok = await handleCreate(payload as ProductMutationInput);
	if (ok) {
		form.reset();
		newImageUrls = [];
		newName = "";
	}
};

const handleRowAction = async (
	id: string | number,
	action: string,
	rowEl: HTMLElement,
) => {
	const resolvedId = String(id);

	if (action === "delete") {
		await handleDelete(resolvedId);
		return;
	}

	if (action === "save") {
		const payload: Record<string, string | number | null> = {};
		rowEl.querySelectorAll("[data-field]").forEach((cell) => {
			const field = cell.getAttribute("data-field");
			if (!field) return;
			if (
				cell instanceof HTMLSelectElement ||
				cell instanceof HTMLInputElement
			) {
				payload[field] =
					field === "isActive" ? (cell.value === "true" ? 1 : 0) : cell.value;
				return;
			}
			if (field === "images_json") {
				payload["imagesJson"] = cell.getAttribute("data-value") || "[]";
				return;
			}
			payload[field] = cell.textContent?.trim() || "";
		});

		if (payload.price) payload.price = Number(payload.price);
		if (payload.stock) payload.stock = Number(payload.stock);

		await handleUpdate(resolvedId, payload as Partial<ProductMutationInput>);
	}
};

const currentCategories = $derived(categories);
</script>
<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
<SectionHeader title="Tambah Produk" badge="E-commerce Ready" />

<CrudInlineForm
  id="product-form"
  onsubmit={productFormHandler}
  isSubmitting={isMutating}
>
  <div class="space-y-6 border-b border-stone-100 pb-8 mb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="space-y-1.5">
        <label
          for="name"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Nama Produk</label
        >
        <input
          id="name"
          name="name"
          required
          bind:value={newName}
          placeholder="Cth: Roti Manis"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="sku"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >SKU (Opsional)</label
        >
        <input
          id="sku"
          name="sku"
          placeholder="PROD-001"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="category_id"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Kategori</label
        >
        <select
          id="category_id"
          name="categoryId"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm appearance-none cursor-pointer outline-none"
        >
          <option value="">Pilih Kategori</option>
          {#each currentCategories as cat}
            <option value={cat.id}>{cat.name}</option>
          {/each}
        </select>
      </div>
      <div class="space-y-1.5">
        <label
          for="price"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Harga (Rp)</label
        >
        <input
          id="price"
          name="price"
          type="number"
          value="0"
          required
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="stock"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Stok</label
        >
        <input
          id="stock"
          name="stock"
          type="number"
          placeholder="0"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="isActive"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Status</label
        >
        <select
          id="isActive"
          name="isActive"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm appearance-none cursor-pointer outline-none"
        >
          <option value="true" selected>Aktif</option>
          <option value="false">Draf</option>
        </select>
      </div>
    </div>
    <div class="space-y-1.5">
      <label
        for="description"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Deskripsi</label
      >
      <textarea
        id="description"
        name="description"
        rows="3"
        placeholder="Berikan deskripsi singkat produk..."
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm resize-none outline-none"
      ></textarea>
    </div>
  </div>
  <div class="field mt-4 space-y-1">
    <label
      for="file-input"
      class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
      >Gambar Produk</label
    >
    <div
      class="upload-zone border-2 border-dashed border-stone-200/80 rounded-2xl p-6 hover:bg-stone-50/50 hover:border-[#c48a3a]/40 transition-colors text-center cursor-pointer relative"
      id="upload-zone"
      role="button"
      tabindex="0"
      ondragover={(e: DragEvent) => e.preventDefault()}
      ondrop={handleDrop}
    >
      <input
        type="file"
        id="file-input"
        multiple
        accept="image/*"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onchange={handleFileUpload}
      />
      <div class="upload-placeholder flex flex-col items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="text-stone-400"
          ><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle
            cx="8.5"
            cy="8.5"
            r="1.5"
          ></circle><polyline points="21 15 16 10 5 21"></polyline></svg
        >
        <span class="text-sm font-semibold text-stone-600"
          >Drag & drop gambar atau klik untuk upload</span
        >
        <p class="muted text-xs text-stone-400 font-medium">
          Urutan gambar pertama = Foto Utama
        </p>
      </div>
    </div>
    <div class="mt-4">
      <ImageGallery
        urls={newImageUrls}
        onChange={(next) => (newImageUrls = next)}
      />
    </div>
    <div id="upload-status" class="muted mt-1.5 text-xs">{uploadStatus}</div>
  </div>
  <div class="flex items-end mt-4">
    <button
      class="flex items-center justify-center gap-3 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto mt-auto"
      type="submit"
      disabled={isMutating}
    >
      {#if isMutating}
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
      Tambah Produk
    </button>
  </div>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Produk" muted="Klik sel untuk edit" />
</div>
<div class="mt-2" role="button" tabindex="0">
  <AdminDataTable>
    <thead>
      <tr>
        <th>Foto</th>
        <th>Nama</th>
        <th>Kategori</th>
        <th>Harga</th>
        <th>Stok</th>
        <th>Status</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#if currentRows.length === 0}
        <tr>
          <td
            colspan="7"
            class="text-center py-12 text-stone-400 text-sm italic"
            >Belum ada produk terdaftar.</td
          >
        </tr>
      {/if}
      {#each currentRows as row (row.id)}
        <tr
          transition:fade={{ duration: 200 }}
          data-id={row.id}
          class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
        >
          <td class="py-4">
            <div data-field="images_json" data-value={row.imagesJson || "[]"}>
              <ImageGallery
                urls={parseUrls(row.imagesJson || "[]")}
                onChange={(next) => {
                  row.imagesJson = JSON.stringify(next);
                }}
              />
            </div>
          </td>
          <td class="py-4">
            <div
              contenteditable="true"
              data-field="name"
              class="font-bold text-stone-900 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-3 py-1.5 rounded-lg border border-transparent transition-all"
            >
              {row.name}
            </div>
            <div
              class="text-[0.7rem] font-bold text-stone-400 uppercase tracking-widest mt-1 ml-3"
            >
              SKU:
              <span
                contenteditable="true"
                data-field="sku"
                class="text-stone-600 ml-1 outline-none hover:bg-white focus:bg-white px-1.5 py-0.5 rounded transition-all"
                >{row.sku || "-"}</span
              >
            </div>
          </td>
          <td class="py-4">
            <select
              data-field="categoryId"
              class="px-3 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-transparent text-sm cursor-pointer outline-none"
            >
              <option value="">Tanpa Kategori</option>
              {#each currentCategories as cat}
                <option value={cat.id} selected={cat.id === row.categoryId}>
                  {cat.name}
                </option>
              {/each}
            </select>
          </td>
          <td class="py-4">
            <div
              contenteditable="true"
              data-field="price"
              class="tabular-nums font-bold text-stone-800 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-3 py-1.5 rounded-lg border border-transparent transition-all w-32 text-center"
            >
              {row.price}
            </div>
          </td>
          <td class="py-4">
            <div
              contenteditable="true"
              data-field="stock"
              class="tabular-nums font-bold text-stone-800 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-3 py-1.5 rounded-lg border border-transparent transition-all w-24 text-center"
            >
              {row.stock}
            </div>
          </td>
          <td class="py-4">
            <select
              data-field="isActive"
              class="px-3 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-transparent text-sm cursor-pointer outline-none font-medium"
            >
              <option value="true" selected={row.isActive === 1}>Aktif</option>
              <option value="false" selected={row.isActive === 0}>Draf</option>
            </select>
          </td>
          <td class="py-4">
            <RowActions
              isSaving={isMutating}
              isDeleting={isMutating}
              onSave={(e) =>
                handleRowAction(row.id, "save", e.currentTarget.closest("tr")!)}
              onDelete={() => handleRowAction(row.id, "delete", null!)}
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>
</div>

<ToastNotification bind:this={toastRef} />
