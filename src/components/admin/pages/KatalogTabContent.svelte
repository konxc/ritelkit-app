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
      products?: any[];
      inventoryProducts?: any[];
      inventoryMovements?: any[];
    };
  } = $props();
</script>

<QueryProvider {initialData}>
  {#if tab === "kategori"}
    <CategoriesManager rows={initialData.categories} />
  {:else if tab === "produk"}
    <ProductsManager rows={initialData.products} categories={initialData.categories} />
  {:else if tab === "inventory"}
    <InventoryManager
      products={initialData.inventoryProducts}
      movements={initialData.inventoryMovements}
      categories={initialData.categories}
    />
  {/if}
</QueryProvider>
