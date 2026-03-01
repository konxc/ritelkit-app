<script lang="ts">
import { onMount } from "svelte";
import CartDrawer from "./CartDrawer.svelte";
import ProductCard from "./ProductCard.svelte";

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

let totalPrice = $derived(
  Array.from(cart.values()).reduce((sum, item) => sum + item.price * item.qty, 0),
);

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
<main
    class="fixed inset-0 flex flex-col bg-surface overflow-hidden"
    id="app-container"
>
    <!-- Main Top App Bar -->
    <header
        class="bg-white/95 backdrop-blur-md border-b border-border/80 shrink-0 z-20"
    >
        <div
            class="h-14 md:h-16 flex items-center justify-between px-4 lg:px-8 w-full max-w-6xl mx-auto"
        >
            <a
                href="/"
                class="p-2 -ml-2 text-text-muted hover:text-primary transition-colors hover:bg-primary/5 rounded-full flex items-center gap-1 min-w-[32px]"
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
                <span class="text-sm font-semibold hidden sm:block"
                    >Kembali</span
                >
            </a>
            <div class="flex flex-col items-center">
                <h1
                    class="font-bold text-lg md:text-xl text-primary-dark font-fraunces"
                >
                    Pesan Roti
                </h1>
            </div>

            <!-- Cart Icon toggle for mobile -->
            <button
                onclick={() => (isCartOpen = !isCartOpen)}
                class="p-2 -mr-2 text-text-muted hover:text-primary transition-colors relative lg:hidden min-w-[32px]"
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
                    ><circle cx="8" cy="21" r="1" /><circle
                        cx="19"
                        cy="21"
                        r="1"
                    /><path
                        d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
                    /></svg
                >
                {#if totalQty > 0}
                    <span
                        class="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-secondary text-primary-dark text-[10px] font-bold flex items-center justify-center border border-white"
                    >
                        {totalQty}
                    </span>
                {/if}
            </button>
            <div class="hidden lg:block w-16"></div>
        </div>
    </header>

    <!-- Workspace -->
    <div
        class="flex-1 overflow-hidden flex flex-col lg:flex-row w-full max-w-6xl mx-auto relative"
    >
        <!-- Product List Area -->
        <div
            class="flex-1 overflow-y-auto no-scrollbar relative z-0 pb-[100px] lg:pb-0"
        >
            <div class="p-4 lg:p-6 space-y-5">
                <!-- Search Bar -->
                <div
                    class="bg-white/90 backdrop-blur-sm rounded-2xl p-1.5 flex items-center shadow-sm border border-border/80 sticky top-0 z-10 transition-all focus-within:ring-2 focus-within:ring-primary/20"
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
                        class="text-text-muted/40 ml-3"
                        ><circle cx="11" cy="11" r="8" /><path
                            d="m21 21-4.3-4.3"
                        /></svg
                    >
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="Cari Varian Roti..."
                        class="w-full bg-transparent border-none outline-none text-[0.95rem] p-2 placeholder:text-text-muted/40 font-medium text-primary-dark"
                        autocomplete="off"
                    />
                    {#if searchQuery}
                        <button
                            onclick={() => (searchQuery = "")}
                            class="p-2 text-text-muted/50 hover:text-red-400 mr-1"
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
                                stroke-linejoin="round"
                                ><path d="M18 6 6 18" /><path
                                    d="m6 6 12 12"
                                /></svg
                            >
                        </button>
                    {/if}
                </div>

                {#if filteredProducts.length === 0}
                    <div
                        class="flex-col items-center justify-center py-16 text-center text-text-muted opacity-60 flex"
                    >
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
                            class="mb-4 text-primary/30"
                            ><circle cx="11" cy="11" r="8" /><path
                                d="m21 21-4.3-4.3"
                            /></svg
                        >
                        <p class="font-medium text-lg">Menu tidak ditemukan</p>
                    </div>
                {:else}
                    <div
                        class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5 pb-8"
                    >
                        {#each filteredProducts as product (product.id)}
                            <ProductCard
                                {product}
                                onAdd={() => addToCart(product)}
                            />
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Cart Drawer -->
        <CartDrawer
            bind:isOpen={isCartOpen}
            {cart}
            {totalQty}
            {totalPrice}
            {updateQty}
            {env}
        />
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
