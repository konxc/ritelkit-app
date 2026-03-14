<script lang="ts">
  import { onMount } from "svelte";
  import CartDrawer from "@/components/storefront/CartDrawer.svelte";
  import ProductCard from "@/components/storefront/ProductCard.svelte";

  interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string;
    stock: number;
  }

  interface CartItem extends Product {
    qty: number;
  }

  let { products = [], env } = $props<{ products: Product[]; env: any }>();

  // State
  let cart = $state(new Map<string, CartItem>());
  let searchQuery = $state("");
  let isCartOpen = $state(false);

  // Derived
  let filteredProducts = $derived(
    products.filter(
      (p: Product) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  let totalQty = $derived(Array.from(cart.values()).reduce((sum, item) => sum + item.qty, 0));

  let totalPrice = $derived(Array.from(cart.values()).reduce((sum, item) => sum + item.price * item.qty, 0));

  // Actions
  function addToCart(product: Product) {
    if (cart.has(product.id)) {
      const item = cart.get(product.id)!;
      cart.set(product.id, { ...item, qty: item.qty + 1 });
    } else {
      cart.set(product.id, { ...product, qty: 1 });
    }
  }

  function updateQty(id: string, delta: number) {
    if (!cart.has(id)) return;
    const item = cart.get(id)!;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      cart.delete(id);
    } else {
      cart.set(id, { ...item, qty: newQty });
    }
  }

  // Sync search with URL
  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("q")) {
      searchQuery = params.get("q")!;
    }
  });

  $effect(() => {
    const url = new URL(window.location.href);
    if (searchQuery) url.searchParams.set("q", searchQuery);
    else url.searchParams.delete("q");
    window.history.replaceState({}, "", url);
  });
</script>

<!-- App Wrapper -->
<main class="bg-surface fixed inset-0 flex flex-col overflow-hidden" id="app-container">
  <!-- Main Top App Bar -->
  <header class="border-border/80 z-20 shrink-0 border-b bg-white/95 backdrop-blur-md">
    <div class="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:h-16 lg:px-8">
      <a
        href="/"
        class="text-text-muted hover:text-primary hover:bg-primary/5 -ml-2 flex min-w-[32px] items-center gap-1 rounded-full p-2 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          class="shrink-0"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
        >
        <span class="hidden text-sm font-semibold sm:block">Kembali</span>
      </a>
      <div class="flex flex-col items-center">
        <h1 class="text-primary-dark font-fraunces text-lg font-bold md:text-xl">Pesan Roti</h1>
      </div>

      <!-- Cart Icon toggle for mobile -->
      <button
        onclick={() => (isCartOpen = !isCartOpen)}
        class="text-text-muted hover:text-primary relative -mr-2 min-w-[32px] p-2 transition-colors lg:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path
            d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
          /></svg
        >
        {#if totalQty > 0}
          <span
            class="bg-secondary text-primary-dark absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white text-[10px] font-bold"
          >
            {totalQty}
          </span>
        {/if}
      </button>
      <div class="hidden w-16 lg:block"></div>
    </div>
  </header>

  <!-- Workspace -->
  <div class="relative mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden lg:flex-row">
    <!-- Product List Area -->
    <div class="no-scrollbar relative z-0 flex-1 overflow-y-auto pb-[100px] lg:pb-0">
      <div class="space-y-5 p-4 lg:p-6">
        <!-- Search Bar -->
        <div
          class="border-border/80 focus-within:ring-primary/20 sticky top-0 z-10 flex items-center rounded-2xl border bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-all focus-within:ring-2"
        >
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
            class="text-text-muted/40 ml-3"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg
          >
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Cari Varian Roti..."
            class="placeholder:text-text-muted/40 text-primary-dark w-full border-none bg-transparent p-2 text-[0.95rem] font-medium outline-none"
            autocomplete="off"
          />
          {#if searchQuery}
            <button
              onclick={() => (searchQuery = "")}
              class="text-text-muted/50 mr-1 p-2 hover:text-red-400"
              aria-label="Bersihkan pencarian"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
              >
            </button>
          {/if}
        </div>

        {#if filteredProducts.length === 0}
          <div class="text-text-muted flex flex-col items-center justify-center py-16 text-center opacity-60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-primary/30 mb-4"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg
            >
            <p class="text-lg font-medium">Menu not found</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 gap-4 pb-8 sm:grid-cols-2 lg:gap-5 xl:grid-cols-3">
            {#each filteredProducts as product (product.id)}
              <ProductCard {product} onAdd={() => addToCart(product)} />
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Cart Drawer -->
    <CartDrawer bind:isOpen={isCartOpen} {cart} {totalQty} {totalPrice} {updateQty} {env} />
  </div>
</main>

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
