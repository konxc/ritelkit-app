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
  csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content") || "";
});

const productsQuery = createQuery(() => ({
  queryKey: ["products.list"],
  queryFn: () => trpc.products.list.query(),
  initialData: initialRows.length > 0 ? (initialRows as any) : undefined,
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

const handleUpdate = async (id: string, data: Partial<ProductMutationInput>) => {
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

let isDrawerOpen = $state(false);
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
    isDrawerOpen = false;
  }
};

const handleRowAction = async (id: string | number, action: string, rowEl: HTMLElement) => {
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
      if (cell instanceof HTMLSelectElement || cell instanceof HTMLInputElement) {
        payload[field] = field === "isActive" ? (cell.value === "true" ? 1 : 0) : cell.value;
        return;
      }
      if (field === "images_json") {
        payload.imagesJson = cell.getAttribute("data-value") || "[]";
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
<div class="flex items-center justify-between mt-2 mb-8">
  <SectionHeader title="Daftar Produk" muted="Kelola produk, edit harga, dan perbarui stok." />
  <button
    class="flex items-center gap-2 px-4 py-2 bg-stone-900 border border-transparent rounded-xl text-white text-[0.85rem] font-bold shadow-sm hover:bg-stone-800 transition-all hover:shadow-md"
    onclick={() => isDrawerOpen = true}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
    Tambah Produk
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
  
  <div class="relative w-full max-w-xl bg-white border-l border-stone-100 h-full shadow-2xl flex flex-col z-[101]" transition:fly={{x: 400, opacity: 1, duration: 300}}>
    <div class="flex items-center justify-between px-6 py-5 border-b border-stone-100 bg-stone-50/50">
      <div>
        <h3 class="font-bold text-stone-800 text-lg">Tambah Produk</h3>
        <p class="text-xs font-semibold text-stone-400 mt-0.5 uppercase tracking-wider">E-commerce Ready</p>
      </div>
      <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 text-stone-500 transition-colors" onclick={() => isDrawerOpen = false} aria-label="Tutup Panel">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto w-full custom-scrollbar">
      <CrudInlineForm
        id="product-form"
        onsubmit={productFormHandler}
        isSubmitting={isMutating}
      >
        <div class="p-6 space-y-8">
          
          <div class="space-y-6">
             <h4 class="text-xs font-bold text-[#c48a3a] uppercase tracking-widest border-b border-[#c48a3a]/20 pb-2">Informasi Dasar</h4>
             <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div class="space-y-1.5 sm:col-span-2">
                <label
                  for="name"
                  class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
                  >Nama Produk</label
                >
                <input
                  id="name"
                  name="name"
                  required
                  bind:value={newName}
                  placeholder="Cth: Roti Manis"
                  class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm shadow-sm outline-none placeholder:text-stone-300 font-medium"
                />
              </div>
              <div class="space-y-1.5">
                <label
                  for="sku"
                  class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
                  >SKU (Opsional)</label
                >
                <input
                  id="sku"
                  name="sku"
                  placeholder="PROD-001"
                  class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-stone-50 text-sm shadow-sm outline-none placeholder:text-stone-300 font-mono text-stone-600"
                />
              </div>
              <div class="space-y-1.5">
                <label
                  for="category_id"
                  class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
                  >Kategori</label
                >
                <select
                  id="category_id"
                  name="categoryId"
                  class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm shadow-sm font-medium appearance-none cursor-pointer outline-none"
                >
                  <option value="" disabled selected>Pilih Kategori Dasar...</option>
                  {#each currentCategories as cat}
                    <option value={cat.id}>{cat.name}</option>
                  {/each}
                </select>
              </div>
            </div>
            <div class="space-y-1.5">
              <label
                for="description"
                class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
                >Deskripsi</label
              >
              <textarea
                id="description"
                name="description"
                rows="3"
                placeholder="Berikan deskripsi singkat..."
                class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm shadow-sm outline-none resize-none"
              ></textarea>
            </div>
          </div>

          <div class="space-y-6">
             <h4 class="text-xs font-bold text-[#c48a3a] uppercase tracking-widest border-b border-[#c48a3a]/20 pb-2">Penetapan Harga & Stok</h4>
             <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div class="space-y-1.5">
                <label
                  for="price"
                  class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
                  >Harga Penjualan</label
                >
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">Rp</span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="0"
                    required
                    class="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white shadow-sm text-sm outline-none font-bold tabular-nums text-stone-800"
                  />
                </div>
              </div>
              <div class="space-y-1.5">
                <label
                  for="stock"
                  class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
                  >Stok Awal</label
                >
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  placeholder="~"
                  class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white shadow-sm text-sm outline-none font-bold tabular-nums text-center"
                />
              </div>
              <div class="space-y-1.5">
                <label
                  for="isActive"
                  class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
                  >Visibilitas</label
                >
                <select
                  id="isActive"
                  name="isActive"
                  class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm shadow-sm font-medium appearance-none cursor-pointer outline-none"
                >
                  <option value="true" selected>🟢 Publik</option>
                  <option value="false">🔴 Draft</option>
                </select>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <h4 class="text-xs font-bold text-[#c48a3a] uppercase tracking-widest border-b border-[#c48a3a]/20 pb-2">Media & Visual</h4>
            <div class="flex flex-col gap-2 p-6 bg-stone-50/50 border border-stone-100 rounded-3xl self-start space-y-1 w-full relative">
              <label
                for="file-input"
                class="block text-[0.7rem] font-bold text-stone-500 uppercase tracking-wider"
                >Upload Foto Utama dan Galeri</label
              >
              <div
                class="flex-1 min-h-[160px] flex items-center justify-center border-2 border-dashed border-stone-200/80 bg-white shadow-sm rounded-2xl p-6 hover:bg-stone-50 hover:border-[#c48a3a]/40 transition-colors text-center cursor-pointer relative group mt-2"
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
                <div class="flex flex-col items-center gap-3">
                  <div class="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 group-hover:scale-110 group-hover:text-[#c48a3a] transition-all duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div>
                    <span class="text-sm font-bold text-stone-700 block mb-0.5"
                      >Tarik Foto ke Sini</span
                    >
                    <p class="text-[0.65rem] text-stone-400 font-semibold uppercase tracking-wide">
                      atau klik area ini
                    </p>
                  </div>
                </div>
              </div>
              <div id="upload-status" class="text-center font-semibold text-stone-500 mt-1.5 text-xs">{uploadStatus}</div>
              {#if newImageUrls.length > 0}
              <div class="mt-4 w-full">
                <ImageGallery
                  urls={newImageUrls}
                  onChange={(next) => (newImageUrls = next)}
                />
              </div>
              {/if}
            </div>
          </div>
        </div>
        
        <div class="p-6 pt-4 border-t border-stone-100 bg-stone-50/30 sticky bottom-0 z-10 w-full">
          <button
            class="flex items-center justify-center gap-2 h-[46px] rounded-xl bg-gradient-to-r from-[#c48a3a] to-[#a6722d] text-white text-sm font-bold hover:shadow-[0_4px_12px_rgba(196,138,58,0.25)] hover:-translate-y-0.5 transition-all shadow-md w-full disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
            disabled={isMutating}
          >
            {#if isMutating}
              <svg class="animate-spin h-4 w-4 mr-1 inline" viewBox="0 0 24 24"
                ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            {/if}
            Simpan Produk Baru
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
        <th>Galeri</th>
        <th>Informasi Produk</th>
        <th>Kategori</th>
        <th>Harga (Rp)</th>
        <th>Stok Fisik</th>
        <th>Visibilitas</th>
        <th class="text-right">Tindakan</th>
      </tr>
    </thead>
    <tbody>
      {#if currentRows.length === 0}
        <tr>
          <td colspan="7" class="py-12">
            <div class="flex flex-col items-center justify-center text-center">
              <div class="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mb-3 border border-stone-100">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </div>
              <p class="text-sm font-bold text-stone-900 mb-1">Daftar Produk Kosong</p>
              <p class="text-xs text-stone-500 max-w-[200px]">Belum ada produk yang dibuat. Gunakan form di atas untuk menambahkannya.</p>
            </div>
          </td>
        </tr>
      {/if}
      {#each currentRows as row (row.id)}
        <tr
          transition:fade={{ duration: 200 }}
          data-id={row.id}
          class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
        >
          <td class="py-4 vertical-top">
            <div data-field="images_json" data-value={row.imagesJson || "[]"} class="w-[84px] h-[84px] p-1 bg-white border border-stone-100 shadow-sm rounded-xl overflow-hidden hover:scale-105 transition-transform">
              <ImageGallery
                urls={parseUrls(row.imagesJson || "[]")}
                onChange={(next) => {
                  row.imagesJson = JSON.stringify(next);
                }}
              />
            </div>
          </td>
          <td class="py-4">
            <div class="flex flex-col gap-1 items-start max-w-[240px]">
              <div
                contenteditable="true"
                data-field="name"
                class="font-bold text-stone-900 text-[0.95rem] outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-3 py-1.5 rounded-lg border border-stone-200/50 bg-stone-100/60 transition-all w-full truncate leading-tight"
                title={row.name}
              >
                {row.name}
              </div>
              <div class="flex items-center gap-1.5 ml-3">
                 <span class="text-[0.6rem] font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded uppercase tracking-wider">SKU</span>
                 <div
                  contenteditable="true"
                  data-field="sku"
                  class="font-mono text-[0.7rem] text-stone-500 bg-stone-100/60 border border-stone-200/50 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-2 py-0.5 rounded-md transition-all shadow-sm w-full truncate"
                 >
                  {row.sku || "-"}
                 </div>
              </div>
            </div>
          </td>
          <td class="py-4">
            <select
              data-field="categoryId"
              class="px-3 py-2 rounded-xl border border-stone-200/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-stone-100/60 shadow-sm text-sm cursor-pointer outline-none font-semibold text-stone-700 w-[140px] truncate"
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
             <div class="flex items-center">
                <span class="text-xs font-bold text-stone-400 mr-1.5 pl-3">Rp</span>
                <div
                  contenteditable="true"
                  data-field="price"
                  class="tabular-nums font-bold text-stone-800 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-3 py-1.5 rounded-lg border border-stone-200/50 bg-stone-100/60 transition-all w-auto text-left"
                >
                  {row.price}
                </div>
             </div>
          </td>
          <td class="py-4">
            <div class="flex items-center justify-center">
              <div
                contenteditable="true"
                data-field="stock"
                class="tabular-nums font-bold text-stone-700 bg-stone-100/60 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-3 py-1.5 rounded-lg border border-stone-200/50 transition-all w-16 text-center shadow-inner"
              >
                {row.stock}
              </div>
            </div>
          </td>
          <td class="py-4">
            <select
              data-field="isActive"
              class="px-3 py-1.5 rounded-full border border-stone-200/50 bg-stone-100/60 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 transition-all cursor-pointer outline-none font-bold text-[0.75rem] text-stone-700 uppercase tracking-wider"
            >
              <option value="true" selected={row.isActive === 1}>🟢 AKTIF</option>
              <option value="false" selected={row.isActive === 0}>🔴 DRAF</option>
            </select>
          </td>
          <td class="py-4 pr-4">
            <div class="flex items-center justify-end">
             <RowActions
                isSaving={isMutating}
                isDeleting={isMutating}
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
