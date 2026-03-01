<script lang="ts">
import CheckoutForm from "./CheckoutForm.svelte";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

let {
  isOpen = $bindable(false),
  cart,
  totalQty,
  totalPrice,
  updateQty,
  env,
} = $props<{
  isOpen: boolean;
  cart: Map<string, CartItem>;
  totalQty: number;
  totalPrice: number;
  updateQty: (id: string, delta: number) => void;
  env: any;
}>();

const format = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

let cartItems = $derived(Array.from(cart.values()) as CartItem[]);
</script>

<aside
    class="fixed inset-x-0 bottom-0 bg-white rounded-t-[32px] shadow-[0_-15px_40px_rgba(0,0,0,0.06)] transform transition-transform duration-500 z-30 lg:relative lg:translate-y-0 lg:rounded-none lg:border-l lg:border-border/60 lg:shadow-none lg:w-[400px] lg:flex-shrink-0 flex flex-col lg:h-full will-change-transform"
    class:translate-y-0={isOpen}
    class:translate-y-[calc(100%-76px)]={!isOpen}
>
    <!-- Drawer Puller Handle (Mobile only) -->
    <button
        type="button"
        onclick={() => (isOpen = !isOpen)}
        aria-label="Tutup Keranjang"
        class="h-6 w-full flex items-center justify-center lg:hidden cursor-grab active:cursor-grabbing absolute top-0 inset-x-0 bg-transparent z-40 touch-none border-none p-0"
    >
        <div
            class="w-12 h-1.5 bg-border rounded-full pointer-events-none"
        ></div>
    </button>

    <!-- Floating Summary Banner (Mobile Only, Visible when collapsed) -->
    <button
        type="button"
        onclick={() => (isOpen = true)}
        aria-label="Buka Keranjang"
        class="h-[76px] px-6 flex items-center justify-between lg:hidden pt-2 shrink-0 cursor-pointer transition-opacity border-none bg-transparent w-full text-left"
        class:opacity-0={isOpen}
        class:pointer-events-none={isOpen}
    >
        <div class="flex items-center gap-4">
            <div
                class="relative w-12 h-12 bg-primary/10 rounded-[14px] flex items-center justify-center text-primary"
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
                    ><path
                        d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"
                    /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg
                >
                {#if totalQty > 0}
                    <span
                        class="absolute -top-1.5 -right-1.5 w-[22px] h-[22px] bg-secondary text-primary-dark text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white"
                    >
                        {totalQty}
                    </span>
                {/if}
            </div>
            <div>
                <p
                    class="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-0.5"
                >
                    Total Belanja
                </p>
                <strong class="text-primary-dark text-lg"
                    >{totalQty > 0 ? format(totalPrice) : "-"}</strong
                >
            </div>
        </div>
        <span
            class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md"
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
                stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
            >
        </span>
    </button>

    <!-- Expanded Content Area -->
    <div
        class="flex-1 flex flex-col overflow-hidden h-[85dvh] lg:h-full transition-opacity duration-300"
        class:opacity-0={!isOpen &&
            typeof window !== "undefined" &&
            window.innerWidth < 1024}
        class:opacity-100={isOpen ||
            (typeof window !== "undefined" && window.innerWidth >= 1024)}
    >
        <div
            class="px-6 py-4 lg:py-5 border-b border-border/60 shrink-0 hidden lg:flex justify-between items-center bg-surface/30"
        >
            <h2 class="font-bold text-lg text-primary-dark">
                Keranjang & Checkout
            </h2>
            <span
                class="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold"
                >{totalQty} item</span
            >
        </div>

        <!-- Scrollable Form/Cart Section -->
        <div class="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-12">
            <!-- Items -->
            <div class="space-y-3 mb-6">
                {#if cart.size === 0}
                    <div
                        class="text-center py-12 flex flex-col items-center justify-center h-full"
                    >
                        <div
                            class="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4 mx-auto"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="40"
                                height="40"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="text-primary/30"
                                ><path
                                    d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"
                                /><path d="M3 6h18" /><path
                                    d="M16 10a4 4 0 0 1-8 0"
                                /></svg
                            >
                        </div>
                        <p class="text-[0.95rem] font-bold text-primary-dark">
                            Keranjang Kosong
                        </p>
                        <p class="text-sm text-text-muted mt-1">
                            Silakan pilih roti kesukaanmu.
                        </p>
                    </div>
                {:else}
                    {#each cartItems as item (item.id)}
                        <div
                            class="flex justify-between items-center py-3.5 border-b border-border/40 last:border-0"
                        >
                            <div class="flex-1 pr-3">
                                <strong
                                    class="text-[0.95rem] block text-primary-dark leading-snug"
                                    >{item.name}</strong
                                >
                                <div
                                    class="text-[0.85rem] text-primary font-bold mt-1"
                                >
                                    Rp {item.price.toLocaleString("id-ID")}
                                </div>
                            </div>
                            <div
                                class="flex items-center gap-2 bg-surface border border-border/60 rounded-[12px] p-0.5 shadow-sm shrink-0"
                            >
                                <button
                                    type="button"
                                    onclick={() => updateQty(item.id, -1)}
                                    aria-label="Kurangi jumlah"
                                    class="w-8 h-8 flex items-center justify-center rounded-[10px] bg-transparent text-text-muted hover:bg-black/5 hover:text-red-500 transition-colors cursor-pointer active:scale-95"
                                >
                                    {#if item.qty === 1}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2.5"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            ><path d="M3 6h18" /><path
                                                d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                                            /><path
                                                d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                                            /></svg
                                        >
                                    {:else}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2.5"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            ><path d="M5 12h14" /></svg
                                        >
                                    {/if}
                                </button>
                                <span
                                    class="text-[0.9rem] font-bold w-5 text-center text-primary-dark"
                                    >{item.qty}</span
                                >
                                <button
                                    type="button"
                                    onclick={() => updateQty(item.id, 1)}
                                    aria-label="Tambah jumlah"
                                    class="w-8 h-8 flex items-center justify-center rounded-[10px] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer active:scale-95"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2.5"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        ><path d="M5 12h14" /><path
                                            d="M12 5v14"
                                        /></svg
                                    >
                                </button>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>

            {#if cart.size > 0}
                <CheckoutForm {cart} {totalPrice} {env} />
            {/if}
        </div>

        <!-- Bottom Action Bar -->
        <div
            class="bg-white/95 backdrop-blur-xl px-6 py-4 lg:py-5 border-t border-border/60 shrink-0 mt-auto"
        >
            <div class="flex justify-between items-center mb-3 text-[0.95rem]">
                <span class="text-text-muted font-medium">Total Pembayaran</span
                >
                <strong class="font-bold text-primary-dark text-xl"
                    >{format(totalPrice)}</strong
                >
            </div>
            <!-- The real submit button is inside CheckoutForm component, we use a proxy or event here -->
            <!-- For simplicity in this refactor, I'll move the button to CheckoutForm or trigger it -->
        </div>
    </div>
</aside>

<style>
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
