<script lang="ts">
  import { initI18n } from "../../../lib/i18n/store.svelte";
  import { onMount, untrack } from "svelte";
  import type { Category } from "../../../lib/types";
  import CategoriesManager from "./CategoriesManager.svelte";
  import InventoryManager from "./InventoryManager.svelte";
  import ProductsManager from "./ProductsManager.svelte";
  import QueryProvider from "../QueryProvider.svelte";

  let {
    tab,
    q = "",
    page = 1,
    limit = 20,
    initialData = {},
    lang,
  }: {
    tab: string;
    q?: string;
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

  // Root call for SSR and initial hydration (untracked for Svelte 5)
  initI18n(untrack(() => lang));
</script>

<QueryProvider {initialData}>
  {#if tab === "categories"}
    <CategoriesManager rows={initialData.categories} total={initialData.categoriesTotal} />
  {:else if tab === "products"}
    <ProductsManager
      rows={initialData.products}
      total={initialData.productsTotal}
      categories={initialData.categories}
    />
  {:else if tab === "inventory"}
    <InventoryManager
      products={initialData.inventoryProducts}
      productsTotal={initialData.inventoryProductsTotal}
      movements={initialData.inventoryMovements}
      movementsTotal={initialData.inventoryMovementsTotal}
      categories={initialData.categories}
    />
  {/if}
</QueryProvider>
