<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { onMount } from "svelte";
  import type { Product } from "../../../lib/types";
  import Fab from "../ui/Fab.svelte";
  import Drawer from "../ui/overlay/Drawer.svelte";
  import { parseUrls, uploadFiles } from "../../../lib/upload-utils";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import ImageGallery from "../ImageGallery.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import InlineEditableField from "../ui/forms/InlineEditableField.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import CatalogHeaderFilters from "../CatalogHeaderFilters.svelte";
  import ColumnVisibilityToggle from "../ui/ColumnVisibilityToggle.svelte";
  import Textarea from "../ui/forms/Textarea.svelte";

  let columns = $state([
    { id: "foto", label: "Foto", isVisible: true, class: "" },
    { id: "produk", label: "Produk", isVisible: true, class: "" },
    { id: "kategori", label: "Kategori", isVisible: true, class: "hidden lg:table-cell" },
    { id: "harga", label: "Harga", isVisible: true, class: "" },
    { id: "stok", label: "Stok", isVisible: true, class: "" },
    { id: "status", label: "Status", isVisible: true, class: "" },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label, class: c.class })),
    "Aksi",
  ]);

  type ProductRow = Pick<
    Product,
    "id" | "name" | "sku" | "price" | "stock" | "isActive" | "categoryId" | "slug" | "description" | "imagesJson"
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
    total: initialTotal = 0,
    categories = [],
  }: {
    rows?: ProductRow[];
    total?: number;
    categories?: CategoryOption[];
  } = $props();

  const queryClient = useQueryClient();
  let isMutating = $state(false);
  let csrfToken = $state("");
  let toastRef = $state<ToastNotification>();

  let q = $state("");
  let categoryFilterId = $state("");
  let statusFilterValue = $state("");
  let page = $state(1);
  const limit = 20;

  function syncFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    q = params.get("q") || "";
    categoryFilterId = params.get("category") || "";
    statusFilterValue = params.get("status") || "";
    page = parseInt(params.get("page") || "1", 10);
  }

  onMount(() => {
    csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content") || "";
    syncFiltersFromUrl();

    // Listen for URL changes (from navigate or history API)
    window.addEventListener("popstate", syncFiltersFromUrl);
    window.addEventListener("astro:after-navigation", syncFiltersFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFiltersFromUrl);
      window.removeEventListener("astro:after-navigation", syncFiltersFromUrl);
    };
  });

  const productsQuery = createQuery(() => ({
    queryKey: ["products.list", { q, categoryId: categoryFilterId, status: statusFilterValue, page, limit }],
    queryFn: () =>
      trpc.products.list.query({
        q,
        categoryId: categoryFilterId,
        status: statusFilterValue,
        page,
        limit,
      }),
    initialData:
      q === "" && categoryFilterId === "" && statusFilterValue === "" && page === 1
        ? { data: initialRows, total: initialTotal }
        : undefined,
    placeholderData: (prev) => prev, // Keep old data while fetching
  }));

  let currentRows = $derived((productsQuery.data?.data as ProductRow[]) || initialRows);
  let isFetching = $derived(productsQuery.isFetching);

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
  const handleDragOver = (e: DragEvent) => e.preventDefault();
</script>

<div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
  <SectionHeader title="Daftar Produk" muted="Kelola produk, edit harga, dan perbarui stok." />
  <div class="hidden lg:flex lg:items-center lg:gap-3">
    <div class="mr-2">
      <CatalogHeaderFilters tab="products" categoryOptions={currentCategories} columns={columns} />
    </div>

    <ColumnVisibilityToggle bind:columns />

    <div class="h-10 w-px bg-stone-200/80"></div>

    <Button
      variant="outline"
      href="/api/admin/export?entity=products"
      class="border-stone-200 text-stone-600 hover:bg-stone-50"
    >
      <svg
        slot="children"
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="mr-1.5 inline-block"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span class="font-bold">Ekspor</span>
    </Button>

    <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex items-center gap-2">
      <div class="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
        >
        Tambah Produk
      </div>
    </Button>
  </div>
</div>

<Fab onclick={() => (isDrawerOpen = true)} label="Tambah Produk" />

{#snippet productIcon()}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    ><path d="m7.5 4.27 9 5.15" /><path
      d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
    /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg
  >
{/snippet}

{#snippet drawerFooter()}
  <div class="flex items-center gap-3">
    <button
      type="button"
      class="h-11 flex-1 rounded-2xl border border-stone-200 bg-white text-[0.7rem] font-black tracking-widest text-stone-400 uppercase transition-all hover:bg-stone-50 hover:text-stone-600 focus:outline-none active:scale-95 lg:h-[52px]"
      onclick={() => (isDrawerOpen = false)}
    >
      Batalkan
    </button>
    <Button
      type="submit"
      form="product-form"
      variant="primary"
      class="relative flex h-11 flex-[2] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#c48a3a] px-8 py-0 font-black text-white shadow-[0_10px_30px_-10px_rgba(196,138,58,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_35px_-10px_rgba(196,138,58,0.6)] active:scale-[0.98] lg:h-[52px]"
      disabled={isMutating}
    >
      {#if isMutating}
        <div class="flex items-center gap-3">
          <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span class="text-xs">Menyimpan...</span>
        </div>
      {:else}
        <div class="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg
          >
          <span class="text-[0.75rem] tracking-tight">SIMPAN PRODUK BARU</span>
        </div>
      {/if}
    </Button>
  </div>
{/snippet}

<Drawer
  bind:isOpen={isDrawerOpen}
  title="Tambah Produk"
  subtitle="Input Katalog Produk Baru"
  icon={productIcon}
  footer={drawerFooter}
  maxWidth="xl"
>
  <div class="flex h-full flex-col px-5 py-6 lg:px-7 lg:py-8">
    <CrudInlineForm
      id="product-form"
      onsubmit={productFormHandler}
      isSubmitting={isMutating}
      className="flex h-full flex-col"
    >
      <div class="flex flex-1 flex-col space-y-6 lg:space-y-10">
        <div class="space-y-6">
          <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
            Informasi Dasar
          </h4>
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-2 lg:gap-5">
            <div class="col-span-2">
              <TextInput
                id="name"
                name="name"
                label="Nama Produk"
                required
                bind:value={newName}
                placeholder="Masukkan nama produk yang menarik (misal: Roti Sisir Mentega)..."
                class="ring-stone-100/50"
              />
            </div>
            <div>
              <TextInput
                id="sku"
                name="sku"
                label="SKU (Opsional)"
                placeholder="PROD-RT001"
                class="font-mono text-xs text-stone-600 ring-stone-100/50"
              />
            </div>
            <div>
              <SelectInput
                id="category_id"
                name="categoryId"
                label="Kategori"
                options={currentCategories.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
                placeholder="-- Pilih Kategori --"
                class="ring-stone-100/50"
              />
            </div>
          </div>
          <div class="flex flex-1 flex-col space-y-1.5">
            <Textarea
              id="description"
              name="description"
              label="Deskripsi"
              placeholder="Jelaskan detail produk, rasa, tekstur, atau keunggulan lainnya agar menarik pembeli..."
              class="flex-1 ring-stone-100/50"
            />
          </div>
        </div>

        <div class="space-y-6">
          <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
            Penetapan Harga & Stok
          </h4>
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
            <div class="relative space-y-1 lg:space-y-1.5">
              <label for="price" class="block text-[0.75rem] font-bold tracking-wider text-stone-500 uppercase"
                >Harga</label
              >
              <div class="relative">
                <span class="absolute top-1/2 left-3 z-10 -translate-y-1/2 text-xs font-bold text-stone-400">Rp</span>
                <TextInput
                  id="price"
                  name="price"
                  type="number"
                  placeholder="15.000"
                  required
                  class="pl-9 font-bold text-stone-800 tabular-nums ring-stone-100/50"
                />
              </div>
            </div>
            <div>
              <TextInput
                id="stock"
                name="stock"
                type="number"
                label="Stok Awal"
                placeholder="Jumlah sedia"
                class="text-center font-bold tabular-nums ring-stone-100/50"
              />
            </div>
            <div class="col-span-2 lg:col-span-1">
              <SelectInput
                id="isActive"
                name="isActive"
                label="Visibilitas"
                placeholder="-- Status --"
                options={[
                  { label: "🟢 Publik / Aktif", value: "true" },
                  { label: "🔴 Draft / Hidden", value: "false" },
                ]}
                class="ring-stone-100/50"
              />
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
            Media & Visual
          </h4>
          <div
            class="relative flex w-full flex-col gap-2 space-y-1 self-start rounded-3xl border border-stone-100 bg-stone-50/50 p-6 shadow-sm"
          >
            <label for="file-input" class="block text-[0.7rem] font-bold tracking-wider text-stone-500 uppercase"
              >Upload Foto Utama dan Galeri</label
            >
            <div
              class="group relative mt-2 flex min-h-[160px] flex-1 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-stone-200/80 bg-white p-6 text-center shadow-inner transition-colors hover:border-[#c48a3a]/40 hover:bg-stone-50"
              id="upload-zone"
              role="button"
              tabindex="0"
              ondragover={handleDragOver}
              ondrop={handleDrop}
            >
              <input
                type="file"
                id="file-input"
                multiple
                accept="image/*"
                class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onchange={handleFileUpload}
              />
              <div class="flex flex-col items-center gap-3">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 transition-all duration-300 group-hover:scale-110 group-hover:text-[#c48a3a]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line
                      x1="12"
                      y1="3"
                      x2="12"
                      y2="15"
                    /></svg
                  >
                </div>
                <div>
                  <span class="mb-0.5 block text-sm font-bold text-stone-700">Tarik Foto ke Sini</span>
                  <p class="text-[0.65rem] font-semibold tracking-wide text-stone-400 uppercase">atau klik area ini</p>
                </div>
              </div>
            </div>
            <div id="upload-status" class="mt-1.5 text-center text-xs font-semibold text-stone-500">
              {uploadStatus}
            </div>
            {#if newImageUrls.length > 0}
              <div class="mt-4 w-full">
                <ImageGallery urls={newImageUrls} onChange={(next) => (newImageUrls = next)} />
              </div>
            {/if}
          </div>
        </div>
      </div>
    </CrudInlineForm>
  </div>
</Drawer>
<Table headers={activeHeaders}>
  {#if currentRows.length === 0}
    <TableEmptyState
      title="Daftar Produk Kosong"
      subtitle="Belum ada produk yang dibuat. Gunakan form di atas untuk menambahkannya."
      colspan={activeHeaders.length}
    />
  {/if}
  {#each currentRows as row (row.id)}
    <TableRow
      data-id={row.id}
      class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50"
    >
      {#if columns[0].isVisible}
        <TableCell class="vertical-top py-4">
          <div
            data-field="images_json"
            data-value={row.imagesJson || "[]"}
            class="h-16 w-16 overflow-hidden rounded-xl border border-stone-100 bg-white p-1 shadow-sm transition-transform hover:scale-105 lg:h-[84px] lg:w-[84px]"
          >
            <ImageGallery
              urls={parseUrls(row.imagesJson || "[]")}
              onChange={(next) => {
                row.imagesJson = JSON.stringify(next);
              }}
            />
          </div>
        </TableCell>
      {/if}
      {#if columns[1].isVisible}
        <TableCell class="py-4">
          <div class="flex max-w-[240px] flex-col items-start gap-1">
            <InlineEditableField
              value={row.name}
              field="name"
              ariaLabel="Nama Produk"
              title={row.name}
              class="w-full truncate text-[0.85rem] leading-tight lg:text-[0.95rem]"
            />
            <div class="flex items-center gap-1.5 lg:ml-3">
              <span
                class="px-1.2 rounded bg-stone-100 py-0.5 text-[0.55rem] font-bold tracking-wider text-stone-400 uppercase lg:px-1.5 lg:text-[0.6rem]"
                >SKU</span
              >
              <InlineEditableField
                value={row.sku || "-"}
                field="sku"
                ariaLabel="SKU Produk"
                class="w-full truncate px-2 py-0.5 font-mono text-[0.65rem] font-normal text-stone-500 shadow-sm lg:text-[0.7rem]"
              />
            </div>
            <!-- Mobile Category Badge -->
            <div class="mt-0.5 lg:hidden">
              <span class="text-[0.65rem] font-bold tracking-wide text-[#c48a3a] uppercase">
                {categories.find((c) => String(c.id) === String(row.categoryId))?.name || "Tanpa Kategori"}
              </span>
            </div>
          </div>
        </TableCell>
      {/if}
      {#if columns[2].isVisible}
        <TableCell class="hidden py-4 lg:table-cell">
          <select
            data-field="categoryId"
            class="w-[140px] cursor-pointer truncate rounded-xl border border-stone-200/50 bg-stone-100/60 px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
          >
            <option value="">Tanpa Kategori</option>
            {#each categories as cat}
              <option value={cat.id} selected={cat.id === row.categoryId}>
                {cat.name}
              </option>
            {/each}
          </select>
        </TableCell>
      {/if}
      {#if columns[3].isVisible}
        <TableCell class="py-4">
          <div class="flex items-center">
            <span class="mr-1.5 pl-3 text-xs font-bold text-stone-400">Rp</span>
            <InlineEditableField
              value={row.price}
              field="price"
              ariaLabel="Harga Produk"
              class="w-auto text-stone-800 tabular-nums"
            />
          </div>
        </TableCell>
      {/if}
      {#if columns[4].isVisible}
        <TableCell class="py-4">
          <div class="flex items-center">
            <InlineEditableField
              value={row.stock ?? ""}
              field="stock"
              ariaLabel="Stok Produk"
              class="w-20 text-center text-[1rem] tabular-nums"
            />
          </div>
        </TableCell>
      {/if}
      {#if columns[5].isVisible}
        <TableCell class="py-4">
          <select
            data-field="isActive"
            class="cursor-pointer rounded-full border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 text-[0.75rem] font-bold tracking-wider text-stone-700 uppercase transition-all outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
          >
            <option value="true" selected={row.isActive === 1}>🟢 AKTIF</option>
            <option value="false" selected={row.isActive === 0}>🔴 DRAF</option>
          </select>
        </TableCell>
      {/if}
      <TableCell align="center" class="py-4">
        <div class="flex items-center justify-center">
          <RowActions
            isSaving={isMutating}
            isDeleting={isMutating}
            onSave={(e) => handleRowAction(row.id, "save", e.currentTarget.closest("tr")!)}
            onDelete={() => handleRowAction(row.id, "delete", null!)}
          />
        </div>
      </TableCell>
    </TableRow>
  {/each}
</Table>

<ToastNotification bind:this={toastRef} />
