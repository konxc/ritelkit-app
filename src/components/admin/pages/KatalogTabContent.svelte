<script lang="ts">
  let {
    tab,
    subtab = "stock",
    q = "",
    status = "",
    page = 1,
    limit = 20,
    initialData = {},
    lang,
  }: {
    tab: string;
    subtab?: string;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    initialData?: {
      categories?: Category[];
      categoriesTotal?: number;
      products?: any[];
      productsTotal?: number;
      inventoryProducts?: any[];
      inventoryProductsTotal?: number;
      inventoryMovements?: any[];
      inventoryMovementsTotal?: number;
    };
    lang?: any;
  } = $props();
  initI18n(untrack(() => lang));

  import { initI18n } from "@lib/i18n/store.svelte";
  import { onMount, untrack } from "svelte";
  import type { Category } from "@lib/types";
  import CategoriesManager from "@components/admin/pages/CategoriesManager.svelte";
  import InventoryManager from "@components/admin/pages/InventoryManager.svelte";
  import ProductsManager from "@components/admin/pages/ProductsManager.svelte";
  import QueryProvider from "@components/admin/QueryProvider.svelte";

  // Root call for SSR and initial hydration (untracked for Svelte 5)
</script>

<QueryProvider {initialData}>
  {#if tab === "categories"}
    <CategoriesManager
      rows={initialData.categories}
      total={initialData.categoriesTotal}
      {q}
      {status}
      {page}
      {limit}
      {lang}
    />
  {:else if tab === "products"}
    <ProductsManager
      rows={initialData.products}
      total={initialData.productsTotal}
      categoryOptions={initialData.categories}
      {q}
      {status}
      {page}
      {limit}
      {lang}
    />
  {:else if tab === "inventory"}
    <InventoryManager
      products={initialData.inventoryProducts}
      productsTotal={initialData.inventoryProductsTotal}
      movements={initialData.inventoryMovements}
      movementsTotal={initialData.inventoryMovementsTotal}
      categoryOptions={initialData.categories}
      {subtab}
      {q}
      {status}
      {page}
      {limit}
      {lang}
    />
  {/if}
</QueryProvider>
