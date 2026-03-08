<script lang="ts">
  import type { Category, Product } from "../../../lib/types";
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
  } = $props();
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
