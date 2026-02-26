<script module lang="ts">
  export type ProductRow = {
    id: string | number;
    name: string;
    sku?: string | null;
    price: number;
    stock: number;
    category_id?: string | null;
    category_name?: string | null;
    isActive: boolean;
    images_json?: string;
  };

  export type CategoryOption = {
    id: string | number;
    name: string;
  };
</script>

<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { onMount } from "svelte";
  import { trpc } from "../../../lib/trpc";
  import {
    createQuery,
    createMutation,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import {
    renderGallery,
    uploadFiles,
    attachDrop,
    parseUrls,
  } from "../../../lib/admin-product-client";
  import type { Product } from "../../../lib/types";

  type ProductRow = Product & { categoryName?: string | null };
  type CategoryOption = { id: string; name: string };

  let {
    rows: initialRows = [],

    categories = [],
  }: { rows: ProductRow[]; categories: CategoryOption[] } = $props();

  const queryClient = useQueryClient();
  let csrfToken = "";
  let toastRef: ToastNotification;

  // Use tRPC Query for real-time syncing
  const productsQuery = createQuery({
    queryKey: ["products"],
    queryFn: () => trpc.products.list.query(),
    initialData: () => initialRows as any,
  });

  const createMutationFn = createMutation({
    mutationFn: (data: any) => trpc.products.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toastRef?.show("Produk berhasil ditambahkan!", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const updateMutation = createMutation({
    mutationFn: (payload: { id: string; data: any }) =>
      trpc.products.update.mutate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toastRef?.show("Produk diperbarui", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const deleteMutation = createMutation({
    mutationFn: (id: string) => trpc.products.delete.mutate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toastRef?.show("Produk dihapus", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  onMount(() => {
    csrfToken =
      document
        .querySelector("meta[name='csrf-token']")
        ?.getAttribute("content") || "";
  });

  const productFormHandler = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    // Transform FormData to Object
    const payload: any = {};
    formData.forEach((value, key) => {
      if (key === "price" || key === "stock" || key === "cost") {
        payload[key] = Number(value);
      } else if (key === "isActive") {
        payload[key] = value === "true" ? 1 : 0;
      } else if (key === "image_urls") {
        payload["imagesJson"] = JSON.stringify(parseUrls(String(value)));
      } else {
        payload[key] = value;
      }
    });

    createMutationFn.mutate(payload);
    form.reset();
  };

  const handleRowAction = async (
    id: string,
    action: string,
    rowEl: HTMLElement,
  ) => {
    if (action === "delete") {
      if (!confirm("Hapus produk ini?")) return;
      deleteMutation.mutate(id);
      return;
    }

    if (action === "save") {
      const payload: Record<string, any> = {};
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
          payload[field] = cell.getAttribute("data-value") || "[]";
          return;
        }
        payload[field] = cell.textContent?.trim() || "";
      });

      // Simple transformation
      if (payload.price) payload.price = Number(payload.price);
      if (payload.stock) payload.stock = Number(payload.stock);

      updateMutation.mutate({ id, data: payload });
    }
  };

  const setupGallery = () => {
    const input = document.querySelector<HTMLInputElement>("#new-image-urls");
    const container = document.querySelector<HTMLElement>("#new-gallery");
    if (!input || !container) return;
    attachDrop(container, async (files) => {
      const urls = await uploadFiles(files, csrfToken);
      const current = parseUrls(input.value);
      input.value = [...current, ...urls].join(",");
      const next = parseUrls(input.value);
      renderGallery(container, next, (updated) => {
        input.value = updated.join(",");
        renderGallery(container, updated, (up) => {
          input.value = up.join(",");
        });
      });
    });
  };

  const attachGalleryHandlers = (node: HTMLElement) => {
    const value = node.getAttribute("data-value") || "[]";
    const next = JSON.parse(value);
    renderGallery(node, next, (updated) => {
      node.setAttribute("data-value", JSON.stringify(updated));
    });
  };

  $effect(() => {
    if (typeof window !== "undefined") {
      setupGallery();
    }
  });

  const currentRows = $derived($productsQuery.data || initialRows);
</script>

<SectionHeader title="Tambah Produk" badge="E-commerce Ready" />

<CrudInlineForm
  id="product-form"
  on:submit={productFormHandler}
  isSubmitting={$createMutationFn.isPending}
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
          {#each categories as cat}
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
    >
      <input
        type="file"
        id="file-input"
        multiple
        accept="image/*"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
    <div
      id="new-gallery"
      class="thumbnail-gallery mt-2"
      data-has="false"
      data-gallery-input="new-image-urls"
    ></div>
    <div id="upload-status" class="muted mt-1.5 text-xs"></div>
    <input type="hidden" name="image_urls" id="new-image-urls" />
  </div>
  <div class="flex items-end mt-4">
    <button
      class="flex items-center justify-center gap-3 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto mt-auto"
      type="submit"
      disabled={$createMutationFn.isPending}
    >
      {#if $createMutationFn.isPending}
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
          data-id={row.id}
          class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
        >
          <td class="py-4">
            <div
              class="edit-gallery thumbnail-gallery"
              data-field="images_json"
              data-value={row.imagesJson || "[]"}
              use:attachGalleryHandlers
            ></div>
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
              {#each categories as cat}
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
              isSaving={$updateMutation.isPending &&
                $updateMutation.variables?.id === row.id}
              isDeleting={$deleteMutation.isPending &&
                $deleteMutation.variables === row.id}
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

<ToastNotification bind:this={toastRef} />

<ToastNotification bind:this={toastRef} />
