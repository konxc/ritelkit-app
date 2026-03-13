<script lang="ts">
  let {
    rows: initialRows = [],
    total: initialTotal = 0,
    categoryOptions = [],
    q = "",
    status = "",
    page = 1,
    limit = 20,
    lang,
  }: {
    rows?: ProductRow[];
    total?: number;
    categoryOptions?: CategoryOption[];
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();
  initI18n(untrack(() => lang));

  import { trpc } from "../../../lib/trpc";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { onMount, untrack } from "svelte";
  import { fly } from "svelte/transition";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
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
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import Textarea from "../ui/forms/Textarea.svelte";
  import { createAdminFilters } from "../../../lib/admin-filters.svelte";
  import AdminDrawerForm from "../ui/overlay/AdminDrawerForm.svelte";
  import { createAdminMutation } from "../../../lib/admin-mutations.svelte";
  import { createTableState } from "../../../lib/admin-table-state.svelte";
  import PaginationNav from "../PaginationNav.svelte";

  let columns = $state([
    { id: "foto", label: t("catalog.products.photo"), isVisible: true, class: "" },
    { id: "produk", label: t("catalog.products.product"), isVisible: true, class: "" },
    { id: "kategori", label: t("catalog.products.category"), isVisible: true, class: "hidden lg:table-cell" },
    { id: "harga", label: t("catalog.products.price"), isVisible: true, class: "" },
    { id: "stok", label: t("catalog.products.stock"), isVisible: true, class: "" },
    { id: "status", label: t("common.status"), isVisible: true, class: "" },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label, class: c.class })),
    t("common.actions"),
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

  const filters = createAdminFilters({ q, status, page });
  const localLimit = untrack(() => limit) || 20;

  const tableState = createTableState<ProductRow>(() => currentRows);
  const queryClient = useQueryClient();
  let toastRef = $state<ToastNotification>();
  let processingId = $state<string | null>(null);
  let isDrawerOpen = $state(false);

  const productsQuery = createQuery(() => ({
    queryKey: ["products.list", filters.q, filters.status, filters.categoryId, filters.page],
    queryFn: () =>
      trpc.products.list.query({
        q: filters.q,
        status: filters.status,
        categoryId: filters.categoryId,
        limit: localLimit,
        page: filters.page,
      }),
    initialData: filters.isInitial ? { data: initialRows, total: initialTotal } : undefined,
  }));

  const currentRows = $derived(productsQuery.data?.data || []);
  const totalPages = $derived(Math.max(1, Math.ceil((productsQuery.data?.total || 0) / localLimit)));

  // Update table state when query data changes

  const updateMutation = createAdminMutation(
    (input: { id: string; data: Partial<ProductMutationInput> }) => trpc.products.update.mutate(input),
    {
      invalidateKeys: [["products.list"]],
      successMessage: t("catalog.products.toast_update"),
      onSuccess: () => {
        if (processingId) tableState.clearChanges(processingId);
      },
    },
    () => toastRef,
  );

  const deleteMutation = createAdminMutation(
    (id: string) => trpc.products.delete.mutate(id),
    {
      invalidateKeys: [["products.list"]],
      successMessage: t("catalog.products.toast_delete"),
    },
    () => toastRef,
  );

  const createMutation = createAdminMutation(
    (payload: ProductMutationInput) => trpc.products.create.mutate(payload),
    {
      invalidateKeys: [["products.list"]],
      successMessage: t("catalog.products.toast_add"),
      onSuccess: () => {
        isDrawerOpen = false;
        // Reset local form if needed
      },
    },
    () => toastRef,
  );

  let isMutating = $derived(updateMutation.isPending || deleteMutation.isPending || createMutation.isPending);

  const handleSave = async (id: string) => {
    const updates = tableState.editedValues[id];
    if (!updates) return;

    processingId = id;
    try {
      await updateMutation.mutate({ id, data: updates as Partial<ProductMutationInput> });
    } finally {
      processingId = null;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("catalog.products.confirm_delete"))) return;
    processingId = id;
    try {
      await deleteMutation.mutate(id);
    } finally {
      processingId = null;
    }
  };

  let newImageUrls = $state<string[]>([]);
  let uploadStatus = $state("");
  let csrfToken = $state("");

  onMount(() => {
    csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
  });
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
      uploadStatus = "Uploading...";
      const urls = await uploadFiles(input.files, csrfToken);
      newImageUrls = [...newImageUrls, ...urls];
      uploadStatus = "";
    } catch (err: any) {
      toastRef?.show(err.message, "error");
      uploadStatus = "Upload failed";
    }
  };

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files?.length) return;
    try {
      uploadStatus = "Uploading...";
      const urls = await uploadFiles(files, csrfToken);
      newImageUrls = [...newImageUrls, ...urls];
      uploadStatus = "";
    } catch (err: any) {
      toastRef?.show(err.message, "error");
      uploadStatus = "Upload failed";
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

    try {
      await createMutation.mutate(payload as ProductMutationInput);
      form.reset();
      newImageUrls = [];
      newName = "";
    } catch (e) {}
  };

  const currentCategories = $derived(categoryOptions);
  const handleDragOver = (e: DragEvent) => e.preventDefault();
</script>

<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
  <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
    <SectionHeader title={t("catalog.products.title")} muted={t("catalog.products.subtitle")} />
    <div class="hidden lg:flex lg:items-center lg:gap-3">
      <AdminHeaderFilters
        tab="products"
        q={filters.q}
        status={filters.status}
        categoryId={filters.categoryId}
        {categoryOptions}
        bind:columns
        {lang}
      />

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
        <span class="font-bold">{t("common.export")}</span>
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
          {t("catalog.products.add")}
        </div>
      </Button>
    </div>
  </div>

  <Fab onclick={() => (isDrawerOpen = true)} label={t("catalog.products.add")} />

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

  <AdminDrawerForm
    bind:isOpen={isDrawerOpen}
    title={t("catalog.products.add")}
    subtitle={t("catalog.products.subtitle")}
    icon={productIcon}
    isSubmitting={createMutation.isPending}
    onsubmit={productFormHandler}
    formId="product-form"
    saveLabel={t("catalog.products.add")}
  >
    <div class="space-y-6">
      <!-- Basic Info -->
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label for="name" class="text-[0.75rem] font-bold tracking-wider text-stone-500 uppercase"
              >{t("catalog.products.name")}</label
            >
            <TextInput
              name="name"
              id="name"
              required
              bind:value={newName}
              placeholder={t("catalog.products.name_placeholder")}
            />
          </div>
          <div class="space-y-1.5">
            <label for="sku" class="text-[0.75rem] font-bold tracking-wider text-stone-500 uppercase"
              >{t("catalog.products.sku")}</label
            >
            <TextInput name="sku" id="sku" placeholder={t("catalog.products.sku_placeholder")} />
          </div>
        </div>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label for="categoryId" class="text-[0.75rem] font-bold tracking-wider text-stone-500 uppercase"
              >{t("catalog.products.category")}</label
            >
            <SelectInput id="category_id" name="category_id" label={t("catalog.products.category")}>
              {#each categoryOptions as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </SelectInput>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label for="price" class="text-[0.75rem] font-bold tracking-wider text-stone-500 uppercase"
                >{t("catalog.products.price")}</label
              >
              <TextInput type="number" name="price" id="price" required placeholder="0" />
            </div>
            <div class="space-y-1.5">
              <label for="stock" class="text-[0.75rem] font-bold tracking-wider text-stone-500 uppercase"
                >{t("catalog.products.stock")}</label
              >
              <TextInput type="number" name="stock" id="stock" placeholder="0" />
            </div>
          </div>
        </div>
      </div>

      <!-- Images -->
      <div class="space-y-1.5">
        <label for="product-images" class="text-[0.75rem] font-bold tracking-wider text-stone-500 uppercase"
          >{t("catalog.products.photo")}</label
        >
        <div
          role="button"
          tabindex="0"
          class="group relative overflow-hidden rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 transition-all hover:border-[#c48a3a]/30 hover:bg-white"
          ondragover={handleDragOver}
          ondrop={handleDrop}
        >
          <input
            id="product-images"
            type="file"
            class="absolute inset-0 cursor-pointer opacity-0"
            accept="image/*"
            multiple
            onchange={handleFileUpload}
          />
          <div class="flex flex-col items-center justify-center py-8">
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110"
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
                class="text-[#c48a3a]"
                ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line
                  x1="12"
                  y1="3"
                  x2="12"
                  y2="15"
                /></svg
              >
            </div>
            <span class="text-sm font-bold text-stone-700">{t("catalog.products.upload_drag")}</span>
            <p class="text-[0.65rem] font-semibold tracking-widest text-stone-400 uppercase">
              {t("catalog.products.upload_click")}
            </p>
          </div>
        </div>
        {#if uploadStatus}
          <p class="mt-2 text-center text-xs font-bold text-[#c48a3a]">{uploadStatus}</p>
        {/if}
        {#if newImageUrls.length > 0}
          <div class="mt-4">
            <ImageGallery urls={newImageUrls} onChange={(next) => (newImageUrls = next)} />
          </div>
        {/if}
      </div>

      <!-- Description -->
      <div class="space-y-1.5">
        <label for="description" class="text-[0.75rem] font-bold tracking-wider text-stone-500 uppercase"
          >{t("catalog.products.description")}</label
        >
        <Textarea
          name="description"
          id="description"
          rows={4}
          placeholder={t("catalog.products.description_placeholder")}
        />
      </div>

      <!-- Status -->
      <div class="flex items-center gap-3 rounded-2xl bg-stone-50 p-4">
        <input
          type="checkbox"
          name="isActive"
          id="isActive"
          value="true"
          checked
          class="h-4 w-4 rounded border-stone-300 text-[#c48a3a] focus:ring-[#c48a3a]"
        />
        <label for="isActive" class="text-sm font-bold text-stone-700">{t("common.active")}</label>
      </div>
    </div>
  </AdminDrawerForm>
  <Table headers={activeHeaders}>
    {#if currentRows.length === 0}
      <TableEmptyState
        title={t("catalog.products.empty")}
        subtitle={t("catalog.products.empty_desc")}
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
              class="h-16 w-16 overflow-hidden rounded-xl border border-stone-100 bg-white p-1 shadow-sm transition-transform hover:scale-105 lg:h-[84px] lg:w-[84px]"
            >
              <ImageGallery
                urls={parseUrls(tableState.editedValues[row.id]?.imagesJson ?? row.imagesJson ?? "[]")}
                onChange={(next) => {
                  tableState.onEdit(row.id, "imagesJson", JSON.stringify(next));
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
                oninput={(e: any) => tableState.onEdit(row.id, "name", e.currentTarget.innerText)}
                field="name"
                ariaLabel={t("catalog.products.name")}
                title={row.name}
                class="w-full truncate text-[0.85rem] leading-tight lg:text-[0.95rem]"
              />
              <div class="flex items-center gap-1.5 lg:ml-3">
                <span
                  class="px-1.2 rounded bg-stone-100 py-0.5 text-[0.55rem] font-bold tracking-wider text-stone-400 uppercase lg:px-1.5 lg:text-[0.6rem]"
                  >{t("catalog.products.label_sku")}</span
                >
                <InlineEditableField
                  value={row.sku || "-"}
                  oninput={(e: any) => tableState.onEdit(row.id, "sku", e.currentTarget.innerText)}
                  field="sku"
                  ariaLabel={t("catalog.products.sku")}
                  class="w-full truncate px-2 py-0.5 font-mono text-[0.65rem] font-normal text-stone-500 shadow-sm lg:text-[0.7rem]"
                />
              </div>
              <!-- Mobile Category Badge -->
              <div class="mt-0.5 lg:hidden">
                <span class="text-[0.65rem] font-bold tracking-wide text-[#c48a3a] uppercase">
                  {categoryOptions.find(
                    (c) => String(c.id) === String(tableState.editedValues[row.id]?.categoryId ?? row.categoryId),
                  )?.name || t("catalog.products.no_category")}
                </span>
              </div>
            </div>
          </TableCell>
        {/if}
        {#if columns[2].isVisible}
          <TableCell class="hidden py-4 lg:table-cell">
            <select
              onchange={(e) => tableState.onEdit(row.id, "categoryId", e.currentTarget.value)}
              class="w-[140px] cursor-pointer truncate rounded-xl border border-stone-200/50 bg-stone-100/60 px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm transition-all outline-none hover:bg-white focus:border-[#c48a3a]/30 focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/20"
            >
              {#each categoryOptions as cat}
                <option
                  value={cat.id}
                  selected={String(cat.id) === String(tableState.editedValues[row.id]?.categoryId ?? row.categoryId)}
                >
                  {cat.name}
                </option>
              {/each}
            </select>
          </TableCell>
        {/if}
        {#if columns[3].isVisible}
          <TableCell class="py-4">
            <div class="flex items-center">
              <span class="mr-1.5 pl-3 text-xs font-bold text-stone-400">{t("common.currency_symbol")}</span>
              <InlineEditableField
                value={row.price}
                oninput={(e: any) => tableState.onEdit(row.id, "price", Number(e.currentTarget.innerText))}
                field="price"
                ariaLabel={t("catalog.products.price")}
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
                oninput={(e: any) => tableState.onEdit(row.id, "stock", Number(e.currentTarget.innerText))}
                field="stock"
                ariaLabel={t("catalog.products.stock")}
                class="w-20 text-center text-[1rem] tabular-nums"
              />
            </div>
          </TableCell>
        {/if}
        {#if columns[5].isVisible}
          <TableCell class="py-4">
            <select
              onchange={(e) => tableState.onEdit(row.id, "isActive", e.currentTarget.value === "true" ? 1 : 0)}
              class="cursor-pointer rounded-full border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 text-[0.75rem] font-bold tracking-wider text-stone-700 uppercase transition-all outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
            >
              <option value="true" selected={(tableState.editedValues[row.id]?.isActive ?? row.isActive) === 1}
                >{t("catalog.products.active_pub")}</option
              >
              <option value="false" selected={!(tableState.editedValues[row.id]?.isActive ?? row.isActive)}
                >{t("catalog.products.draft_hide")}</option
              >
            </select>
          </TableCell>
        {/if}
        <TableCell align="center" class="py-4">
          <div class="flex items-center justify-center">
            <RowActions
              isSaving={processingId === row.id && updateMutation.isPending}
              isDeleting={processingId === row.id && deleteMutation.isPending}
              onSave={() => handleSave(row.id)}
              onDelete={() => handleDelete(row.id)}
            />
          </div>
        </TableCell>
      </TableRow>
    {/each}
  </Table>

  <PaginationNav
    page={filters.page}
    {totalPages}
    prevHref={filters.page > 1 ? filters.buildPageUrl(filters.page - 1) : undefined}
    nextHref={filters.page < totalPages ? filters.buildPageUrl(filters.page + 1) : undefined}
  />
  <ToastNotification bind:this={toastRef} />
</div>
