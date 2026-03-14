<script lang="ts">
  import CheckoutForm from "@/components/storefront/CheckoutForm.svelte";
  import { t, i18n } from "@/lib/i18n/store.svelte";

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

  const format = (value: number) => i18n.f.currency(value);

  let cartItems = $derived(Array.from(cart.values()) as CartItem[]);
</script>

<aside
  class="lg:border-border/60 fixed inset-x-0 bottom-0 z-30 flex transform flex-col rounded-t-[32px] bg-white shadow-[0_-15px_40px_rgba(0,0,0,0.06)] transition-transform duration-500 will-change-transform lg:relative lg:h-full lg:w-[400px] lg:flex-shrink-0 lg:translate-y-0 lg:rounded-none lg:border-l lg:shadow-none"
  class:translate-y-0={isOpen}
  class:translate-y-[calc(100%-76px)]={!isOpen}
>
  <!-- Drawer Puller Handle (Mobile only) -->
  <button
    type="button"
    onclick={() => (isOpen = !isOpen)}
    aria-label={t("common.close_cart")}
    class="absolute inset-x-0 top-0 z-40 flex h-6 w-full cursor-grab touch-none items-center justify-center border-none bg-transparent p-0 active:cursor-grabbing lg:hidden"
  >
    <div class="bg-border pointer-events-none h-1.5 w-12 rounded-full"></div>
  </button>

  <!-- Floating Summary Banner (Mobile Only, Visible when collapsed) -->
  <button
    type="button"
    onclick={() => (isOpen = true)}
    aria-label={t("common.open_cart")}
    class="flex h-[76px] w-full shrink-0 cursor-pointer items-center justify-between border-none bg-transparent px-6 pt-2 text-left transition-opacity lg:hidden"
    class:opacity-0={isOpen}
    class:pointer-events-none={isOpen}
  >
    <div class="flex items-center gap-4">
      <div class="bg-primary/10 text-primary relative flex h-12 w-12 items-center justify-center rounded-[14px]">
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
          ><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path
            d="M16 10a4 4 0 0 1-8 0"
          /></svg
        >
        {#if totalQty > 0}
          <span
            class="bg-secondary text-primary-dark absolute -top-1.5 -right-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white text-[11px] font-bold"
          >
            {totalQty}
          </span>
        {/if}
      </div>
      <div>
        <p class="text-text-muted mb-0.5 text-[0.7rem] font-bold tracking-wider uppercase">
          {t("common.total_checkout")}
        </p>
        <strong class="text-primary-dark text-lg">{totalQty > 0 ? format(totalPrice) : "-"}</strong>
      </div>
    </div>
    <span class="bg-primary flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md">
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
    class="flex h-[85dvh] flex-1 flex-col overflow-hidden transition-opacity duration-300 lg:h-full"
    class:opacity-0={!isOpen && typeof window !== "undefined" && window.innerWidth < 1024}
    class:opacity-100={isOpen || (typeof window !== "undefined" && window.innerWidth >= 1024)}
  >
    <div
      class="border-border/60 bg-surface/30 hidden shrink-0 items-center justify-between border-b px-6 py-4 lg:flex lg:py-5"
    >
      <h2 class="text-primary-dark text-lg font-bold">{t("common.cart_title")}</h2>
      <span class="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-bold"
        >{t("common.item_count", { count: totalQty })}</span
      >
    </div>

    <!-- Scrollable Form/Cart Section -->
    <div class="no-scrollbar flex-1 overflow-y-auto px-6 pt-4 pb-12">
      <!-- Items -->
      <div class="mb-6 space-y-3">
        {#if cart.size === 0}
          <div class="flex h-full flex-col items-center justify-center py-12 text-center">
            <div class="bg-primary/5 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
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
                ><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path
                  d="M16 10a4 4 0 0 1-8 0"
                /></svg
              >
            </div>
            <p class="text-primary-dark text-[0.95rem] font-bold">{t("common.cart_empty")}</p>
            <p class="text-text-muted mt-1 text-sm">{t("common.select_bread")}</p>
          </div>
        {:else}
          {#each cartItems as item (item.id)}
            <div class="border-border/40 flex items-center justify-between border-b py-3.5 last:border-0">
              <div class="flex-1 pr-3">
                <strong class="text-primary-dark block text-[0.95rem] leading-snug">{item.name}</strong>
                <div class="text-primary mt-1 text-[0.85rem] font-bold">
                  {i18n.f.currency(item.price)}
                </div>
              </div>
              <div
                class="bg-surface border-border/60 flex shrink-0 items-center gap-2 rounded-[12px] border p-0.5 shadow-sm"
              >
                <button
                  type="button"
                  onclick={() => updateQty(item.id, -1)}
                  aria-label={t("common.decrease_qty")}
                  class="text-text-muted flex h-8 w-8 cursor-pointer items-center justify-center rounded-[10px] bg-transparent transition-colors hover:bg-black/5 hover:text-red-500 active:scale-95"
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
                      ><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path
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
                      stroke-linejoin="round"><path d="M5 12h14" /></svg
                    >
                  {/if}
                </button>
                <span class="text-primary-dark w-5 text-center text-[0.9rem] font-bold">{item.qty}</span>
                <button
                  type="button"
                  onclick={() => updateQty(item.id, 1)}
                  aria-label={t("common.increase_qty")}
                  class="bg-primary/10 text-primary hover:bg-primary flex h-8 w-8 cursor-pointer items-center justify-center rounded-[10px] transition-colors hover:text-white active:scale-95"
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
                    stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
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
    <div class="border-border/60 mt-auto shrink-0 border-t bg-white/95 px-6 py-4 backdrop-blur-xl lg:py-5">
      <div class="mb-3 flex items-center justify-between text-[0.95rem]">
        <span class="text-text-muted font-medium">{t("common.total_payment")}</span>
        <strong class="text-primary-dark text-xl font-bold">{format(totalPrice)}</strong>
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
