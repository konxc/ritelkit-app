<script lang="ts">
  let {
    products: initialProducts = [],
    productsTotal: initialProductsTotal = 0,
    movements: initialMovements = [],
    movementsTotal: initialMovementsTotal = 0,
    categoryOptions = [],
    subtab = "stock",
    q = "",
    status = "",
    page = 1,
    limit = 20,
    lang,
  }: {
    products?: any[];
    productsTotal?: number;
    movements?: any[];
    movementsTotal?: number;
    categoryOptions?: any[];
    subtab?: string;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();
  initI18n(untrack(() => lang));

  import { trpc } from "@/lib/trpc";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { t, initI18n } from "@/lib/i18n/store.svelte";
  import RowActions from "@/components/admin/RowActions.svelte";
  import SectionHeader from "@/components/admin/SectionHeader.svelte";
  import ToastNotification from "@/components/admin/ToastNotification.svelte";
  import Table from "@/components/admin/ui/Table.svelte";
  import TableRow from "@/components/admin/ui/TableRow.svelte";
  import TableCell from "@/components/admin/ui/TableCell.svelte";
  import TableEmptyState from "@/components/admin/ui/TableEmptyState.svelte";
  import InlineEditableField from "@/components/admin/ui/forms/InlineEditableField.svelte";
  import Button from "@/components/admin/ui/Button.svelte";
  import TextInput from "@/components/admin/ui/forms/TextInput.svelte";
  import SelectInput from "@/components/admin/ui/forms/SelectInput.svelte";
  import Textarea from "@/components/admin/ui/forms/Textarea.svelte";
  import { fly } from "svelte/transition";
  import { untrack } from "svelte";
  import Fab from "@/components/admin/ui/Fab.svelte";
  import Badge from "@/components/admin/ui/Badge.svelte";
  import AdminDrawerForm from "@/components/admin/ui/overlay/AdminDrawerForm.svelte";
  import AdminHeaderFilters from "@/components/admin/AdminHeaderFilters.svelte";
  import { createAdminFilters } from "@/lib/admin-filters.svelte";
  import { createAdminMutation } from "@/lib/admin-mutations.svelte";
  import { normalizeTab } from "@/lib/admin";
  import PaginationNav from "@/components/admin/PaginationNav.svelte";
  import { onMount } from "svelte";

  const filters = createAdminFilters({
    q: untrack(() => q),
    status: untrack(() => status),
    page: untrack(() => page),
    subtab: untrack(() => subtab),
  });
  const localLimit = untrack(() => limit) || 20;

  let toastRef = $state<ToastNotification>();
  let isDrawerOpen = $state(false);

  // Stock Query
  const stockQuery = createQuery(() => ({
    queryKey: ["inventory.stock", filters.q, filters.categoryId, filters.page],
    queryFn: () =>
      trpc.inventory.listProducts.query({
        q: filters.q,
        categoryId: filters.categoryId,
        page: filters.page,
        limit: localLimit,
      }),
    enabled: filters.subtab === "stock",
    initialData: filters.isInitial ? { data: initialProducts, total: initialProductsTotal } : undefined,
  }));

  // Log Query
  const logQuery = createQuery(() => ({
    queryKey: ["inventory.log", filters.q, filters.page],
    queryFn: () =>
      trpc.inventory.listMovements.query({
        q: filters.q,
        page: filters.page,
        limit: localLimit,
      }),
    enabled: filters.subtab === "log",
    initialData: filters.isInitial ? { data: initialMovements, total: initialMovementsTotal } : undefined,
  }));

  const movementMutation = createAdminMutation(
    (data: any) => trpc.inventory.createMovement.mutate(data),
    {
      invalidateKeys: [["inventory.stock"], ["inventory.log"]],
      successMessage: t("catalog.inventory.toast_add"),
      onSuccess: () => {
        isDrawerOpen = false;
      },
    },
    () => toastRef,
  );

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const data = {
      productId: String(formData.get("product_id")),
      type: String(formData.get("type")) as any,
      qty: Number(formData.get("qty")),
      notes: (formData.get("notes") as string) || undefined,
    };
    await movementMutation.mutate(data);
  };

  const currentProducts = $derived(stockQuery.data?.data || []);
  const currentLogs = $derived(logQuery.data?.data || []);

  let stockColumns = $state([
    { id: "produk", label: t("catalog.products.product"), isVisible: true },
    { id: "sku", label: t("catalog.inventory.sku_label"), isVisible: true },
    { id: "stok", label: t("catalog.inventory.avail_stock"), isVisible: true },
    { id: "harga", label: t("catalog.inventory.actual_price"), isVisible: true },
  ]);

  let logColumns = $state([
    { id: "produk", label: t("catalog.products.product"), isVisible: true },
    { id: "tipe", label: t("catalog.inventory.activity"), isVisible: true },
    { id: "qty", label: t("catalog.inventory.qty"), isVisible: true },
    { id: "ref", label: t("catalog.inventory.ref"), isVisible: true },
    { id: "catatan", label: t("catalog.inventory.notes"), isVisible: true },
    { id: "waktu", label: t("catalog.inventory.time"), isVisible: true },
  ]);

  const stockHeaders = $derived(stockColumns.filter((c) => c.isVisible).map((c) => ({ label: c.label })));
  const logHeaders = $derived(logColumns.filter((c) => c.isVisible).map((c) => ({ label: c.label })));

  let activeColumns = $state(stockColumns);
  $effect(() => {
    activeColumns = filters.subtab === "log" ? logColumns : stockColumns;
  });

  const totalPages = $derived(
    filters.subtab === "log"
      ? Math.max(1, Math.ceil((logQuery.data?.total || 0) / localLimit))
      : Math.max(1, Math.ceil((stockQuery.data?.total || 0) / localLimit)),
  );
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <SectionHeader
          title={filters.subtab === "log" ? t("catalog.inventory.log_title") : t("catalog.inventory.stock_title")}
          muted={filters.subtab === "log" ? t("catalog.inventory.log_muted") : t("catalog.inventory.stock_muted")}
        />

        <div class="mt-4 flex items-center gap-2">
          <Button
            variant={filters.subtab === "stock" || filters.subtab === "" ? "primary" : "secondary"}
            outline={filters.subtab !== "stock" && filters.subtab !== ""}
            onclick={() => {
              filters.subtab = "stock";
              filters.updateUrl();
            }}
            class="h-9 px-4 text-[0.7rem] font-bold tracking-wider uppercase"
          >
            {t("catalog.inventory.stock_tab")}
          </Button>
          <Button
            variant={filters.subtab === "log" ? "primary" : "secondary"}
            outline={filters.subtab !== "log"}
            onclick={() => {
              filters.subtab = "log";
              filters.updateUrl();
            }}
            class="h-9 px-4 text-[0.7rem] font-bold tracking-wider uppercase"
          >
            {t("catalog.inventory.log_tab")}
          </Button>
        </div>
      </div>

      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters
          tab="inventory"
          q={filters.q}
          status={filters.status}
          categoryId={filters.categoryId}
          {categoryOptions}
          bind:columns={activeColumns}
          {lang}
        />
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
              stroke-linejoin="round"><path d="m16 11 2 2 4-4" /><path d="M5 12h14" /><path d="M12 5v14" /></svg
            >
            {t("catalog.inventory.process_mutation")}
          </div>
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("catalog.inventory.process_mutation")} />

    {#snippet inventoryIcon()}
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
        ><path
          d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg
      >
    {/snippet}

    <AdminDrawerForm
      bind:isOpen={isDrawerOpen}
      title={t("catalog.inventory.process_mutation")}
      subtitle={t("catalog.inventory.form_subtitle")}
      icon={inventoryIcon}
      isSubmitting={movementMutation.isPending}
      onsubmit={handleCreate}
      formId="movement-form"
    >
      <div class="space-y-6">
        <SelectInput id="product_id" name="product_id" label={t("catalog.products.product")} required>
          {#each initialProducts as p}
            <option value={p.id}>{p.name} ({p.sku})</option>
          {/each}
        </SelectInput>

        <div class="grid grid-cols-2 gap-4">
          <SelectInput id="type" name="type" label={t("catalog.inventory.activity")} required>
            <option value="in">{t("catalog.inventory.type_in")}</option>
            <option value="out">{t("catalog.inventory.type_out")}</option>
            <option value="adjustment">{t("catalog.inventory.type_adj")}</option>
          </SelectInput>
          <TextInput id="qty" name="qty" label={t("catalog.inventory.qty")} type="number" required placeholder="0" />
        </div>

        <Textarea
          id="notes"
          name="notes"
          label={t("catalog.inventory.notes")}
          placeholder={t("catalog.inventory.notes_placeholder")}
          rows={3}
        />
      </div>
    </AdminDrawerForm>

    <div class="mt-4">
      {#if filters.subtab === "log"}
        <Table headers={logHeaders}>
          {#if currentLogs.length === 0}
            <TableEmptyState title={t("catalog.inventory.empty_log")} colspan={logHeaders.length} />
          {/if}
          {#each currentLogs as l (l.id)}
            <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
              <TableCell class="py-4">
                <div class="font-bold text-stone-800">{l.product_name || t("common.unknown")}</div>
              </TableCell>
              <TableCell class="py-4">
                <Badge variant={l.type === "in" ? "success" : l.type === "adjustment" ? "default" : "danger"}>
                  {t(`catalog.inventory.type_${l.type}`)}
                </Badge>
              </TableCell>
              <TableCell class="py-4 font-bold tabular-nums {l.qty > 0 ? 'text-green-600' : 'text-red-500'}">
                {l.qty > 0 ? "+" : ""}{l.qty}
              </TableCell>
              <TableCell class="py-4 font-mono text-[10px] text-stone-400">
                {l.refOrderNo || "-"}
              </TableCell>
              <TableCell class="max-w-[200px] truncate py-4 text-stone-500 italic">
                {l.notes || "-"}
              </TableCell>
              <TableCell class="py-4 text-stone-400 tabular-nums">
                {new Date(l.createdAt).toLocaleString()}
              </TableCell>
            </TableRow>
          {/each}
        </Table>
      {:else}
        <Table headers={stockHeaders}>
          {#if currentProducts.length === 0}
            <TableEmptyState title={t("catalog.inventory.empty_stock")} colspan={stockHeaders.length} />
          {/if}
          {#each currentProducts as p (p.id)}
            <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
              <TableCell class="py-4">
                <div class="font-bold text-stone-900">{p.name}</div>
                <div class="font-mono text-[10px] text-stone-400">{p.sku || "-"}</div>
              </TableCell>
              <TableCell class="py-4 font-mono text-stone-500">{p.sku || "-"}</TableCell>
              <TableCell class="py-4 font-bold tabular-nums">
                <InlineEditableField
                  value={p.stock ?? 0}
                  oninput={(e: any) =>
                    movementMutation.mutate({
                      productId: p.id,
                      type: "adjustment",
                      qty: Number(e.currentTarget.innerText),
                      notes: "Manual Adjustment",
                    })}
                  field="stock"
                  type="number"
                />
              </TableCell>
              <TableCell class="py-4 text-stone-600 tabular-nums">
                {t("common.currency_symbol")}
                {p.price?.toLocaleString()}
              </TableCell>
            </TableRow>
          {/each}
        </Table>
      {/if}
    </div>
  </div>

  <PaginationNav
    page={filters.page}
    {totalPages}
    prevHref={filters.page > 1 ? filters.buildPageUrl(filters.page - 1) : undefined}
    nextHref={filters.page < totalPages ? filters.buildPageUrl(filters.page + 1) : undefined}
  />

  <ToastNotification bind:this={toastRef} />
</div>
