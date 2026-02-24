<script lang="ts">
  import { onMount } from "svelte";
  import type {
    CartItem,
    Product,
    SnapCheckoutResponse,
  } from "../../types/order";

  export let products: Product[] = [];

  let cart = new Map<string, CartItem>();
  let cartItems: CartItem[] = [];
  let totalQty = 0;
  let totalAmount = 0;
  let query = "";
  let checkoutMessage = "";
  let checkoutLoading = false;
  let checkoutButtonLabel = "Bayar Sekarang";
  let cartOpen = false;
  let cartPanelInitialized = false;

  const checkoutForm = {
    customer_name: "",
    customer_phone: "",
    city: "",
    district: "",
    street: "",
    delivery_date: "",
    delivery_time: "",
  };

  const formatCurrency = (value = 0) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

  const refreshCart = () => {
    cartItems = Array.from(cart.values());
    totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
    totalAmount = cartItems.reduce((sum, item) => sum + item.qty * item.price, 0);
  };

  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const existing = cart.get(productId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.set(productId, { ...product, qty: 1 });
    }
    refreshCart();
    cartOpen = true;
  };

  const adjustQty = (productId: string, delta: number) => {
    const existing = cart.get(productId);
    if (!existing) return;
    existing.qty += delta;
    if (existing.qty <= 0) {
      cart.delete(productId);
    }
    refreshCart();
  };

  const toggleCart = () => {
    cartOpen = !cartOpen;
  };

  const closeCart = () => {
    cartOpen = false;
  };

  const updateURLParam = (key: string, value: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState({}, "", url);
  };

  const setQuery = (value: string) => {
    query = value;
    updateURLParam("q", value.trim());
  };

  const clearQuery = () => setQuery("");

  const searchMatches = (value: string) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return value.toLowerCase().includes(needle);
  };

  $: filteredProducts = products.filter(
    (product) =>
      searchMatches(product.name) || searchMatches(product.description),
  );
  $: noResults = filteredProducts.length === 0 && query.trim().length > 0;
  $: showClear = query.trim().length > 0;
  $: disableCheckout = checkoutLoading || cartItems.length === 0;

  const waitForSnap = () =>
    new Promise<void>((resolve) => {
      if (typeof window === "undefined") {
        resolve();
        return;
      }
      if (window.snap) {
        resolve();
        return;
      }
      const interval = setInterval(() => {
        if (window.snap) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    checkoutLoading = true;
    checkoutButtonLabel = "Memproses...";
    checkoutMessage = "";

    const payload = {
      customer_name: checkoutForm.customer_name,
      customer_phone: checkoutForm.customer_phone,
      customer_email: "",
      shipping_address: {
        province: "DI Yogyakarta",
        city: checkoutForm.city,
        district: checkoutForm.district,
        street: checkoutForm.street,
      },
      delivery_date: checkoutForm.delivery_date,
      delivery_time: checkoutForm.delivery_time,
      coupon_code: "",
      items: cartItems.map((item) => ({
        product_id: item.id,
        qty: item.qty,
      })),
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data: SnapCheckoutResponse = await res.json();
      checkoutButtonLabel = "Menunggu Pembayaran...";
      await waitForSnap();
      if (!window.snap) {
        throw new Error("Pembayaran instan tidak tersedia.");
      }
      window.snap.pay(data.snap_token, {
        onSuccess: () => {
          cart.clear();
          refreshCart();
          window.location.href = `/order/success?order=${encodeURIComponent(
            data.order_no,
          )}`;
        },
        onPending: () => {
          window.location.href = `/order/pending?order=${encodeURIComponent(
            data.order_no,
          )}`;
        },
        onError: () => {
          throw new Error("Pembayaran dibatalkan/gagal.");
        },
        onClose: () => {
          checkoutLoading = false;
          checkoutButtonLabel = "Bayar Sekarang";
        },
      });
    } catch (error: any) {
      checkoutMessage = error?.message || "Terjadi kesalahan sistem.";
      checkoutLoading = false;
      checkoutButtonLabel = "Bayar Sekarang";
    }
  };

  onMount(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("q")) {
      setQuery(params.get("q") ?? "");
    }
  });

</script>

<main class="fixed inset-0 flex flex-col bg-surface overflow-hidden" id="app-container">
  <header class="bg-white/95 backdrop-blur-md border-b border-border/80 shrink-0 z-20">
    <div class="h-14 md:h-16 flex items-center justify-between px-4 lg:px-8 w-full max-w-6xl mx-auto">
      <a
        href="/"
        class="p-2 -ml-2 text-text-muted hover:text-primary transition-colors hover:bg-primary/5 rounded-full flex items-center gap-1 min-w-[32px]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" class="shrink-0" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="text-sm font-semibold hidden sm:block">Kembali</span>
      </a>
      <div class="flex flex-col items-center">
        <h1 class="font-bold text-lg md:text-xl text-primary-dark font-fraunces">Pesan Roti</h1>
      </div>
      <div class="hidden lg:block w-16"></div>
    </div>
  </header>

  <div class="flex-1 overflow-hidden flex flex-col lg:flex-row w-full max-w-6xl mx-auto relative">
    <div class="flex-1 overflow-y-auto no-scrollbar relative z-0 pb-[100px] lg:pb-0" id="product-list-area">
      <div class="p-4 lg:p-6 space-y-5">
        <div
          class="bg-white/90 backdrop-blur-sm rounded-2xl p-1.5 flex items-center shadow-sm border border-border/80 sticky top-0 z-10 transition-all focus-within:ring-2 focus-within:ring-primary/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-text-muted/40 ml-3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="text"
            id="search-input"
            placeholder="Cari Varian Roti..."
            class="w-full bg-transparent border-none outline-none text-[0.95rem] p-2 placeholder:text-text-muted/40 font-medium text-primary-dark"
            bind:value={query}
            oninput={(event) => setQuery((event.target as HTMLInputElement).value)}
          />
          <button
            id="clear-search-btn"
            class="p-2 text-text-muted/50 hover:text-red-400 hidden mr-1"
            class:hidden={!showClear}
            type="button"
            aria-label="Kosongkan Pencarian"
            onclick={clearQuery}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {#if noResults}
          <div class="hidden flex-col items-center justify-center py-16 text-center text-text-muted opacity-60" id="no-results" class:flex={!noResults ? undefined : undefined}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 text-primary/30"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <p class="font-medium text-lg">Menu tidak ditemukan</p>
          </div>
        {/if}

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5 pb-8" id="products-grid">
          {#each filteredProducts as product}
            <div
              class="group bg-white rounded-[20px] p-3 shadow-sm border border-border/60 hover:border-primary/30 transition-all flex md:flex-col gap-4 product-card"
              data-name={product.name.toLowerCase()}
              data-desc={product.description.toLowerCase()}
            >
              <div class="relative w-[110px] h-[110px] md:w-full md:h-auto md:aspect-[4/3] shrink-0 rounded-2xl overflow-hidden bg-surface flex justify-center items-center">
                {#if product.image}
                  <img
                    src={product.image}
                    alt={product.name}
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" class="text-primary/20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                {/if}
              </div>
              <div class="flex-1 flex flex-col justify-between py-1 md:py-0 w-full min-w-0">
                <div>
                  <h3 class="text-[1rem] md:text-[1.1rem] font-bold text-primary-dark leading-snug line-clamp-2 md:mb-1">
                    {product.name}
                  </h3>
                  <p class="text-[0.8rem] text-text-muted line-clamp-2 leading-relaxed hidden md:-webkit-box mt-0.5">
                    {product.description}
                  </p>
                </div>
                <div class="flex justify-between items-center mt-3 gap-2">
                  <span class="font-bold text-primary text-[0.95rem] md:text-[1.05rem]">
                    {formatCurrency(product.price)}
                  </span>
                  <button
                    class="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all active:scale-95"
                    type="button"
                    onclick={() => addToCart(product.id)}
                    aria-label="Tambah item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <aside
      id="cart-panel"
      class:bg-opened={cartOpen}
      class="fixed inset-x-0 bottom-0 bg-white rounded-t-[32px] shadow-[0_-15px_40px_rgba(0,0,0,0.06)] transform translate-y-[calc(100%-76px)] transition-transform duration-500 z-30 lg:relative lg:translate-y-0 lg:rounded-none lg:border-l lg:border-border/60 lg:shadow-none lg:w-[400px] lg:flex-shrink-0 flex flex-col lg:h-full will-change-transform"
    >
      <div id="cart-puller"
        class="h-6 w-full flex items-center justify-center lg:hidden cursor-grab active:cursor-grabbing absolute top-0 inset-x-0 bg-transparent z-40 touch-none"
        role="button" tabindex="0" onclick={closeCart} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}
      >
        <div class="w-12 h-1.5 bg-border rounded-full pointer-events-none"></div>
      </div>

      <div id="floating-cart-summary"
        class="h-[76px] px-6 flex items-center justify-between lg:hidden pt-2 shrink-0 cursor-pointer"
        role="button" tabindex="0" onclick={toggleCart} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}
      >
        <div class="flex items-center gap-4">
          <div class="relative w-12 h-12 bg-primary/10 rounded-[14px] flex items-center justify-center text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span
              id="floating-badge"
              class={`absolute -top-1.5 -right-1.5 w-[22px] h-[22px] bg-secondary text-primary-dark text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white transition-all ${totalQty > 0 ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
            >
              {totalQty}
            </span>
          </div>
          <div>
            <p class="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-0.5">Total Belanja</p>
            <strong id="floating-total" class="text-primary-dark text-lg">
              {totalQty === 0 ? "-" : formatCurrency(totalAmount)}
            </strong>
          </div>
        </div>
        <span class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </span>
      </div>

      <div id="cart-expanded-content" class:bg-opened_content={cartOpen} class="flex-1 flex flex-col overflow-hidden h-[85dvh] lg:h-full opacity-0 lg:opacity-100 transition-opacity">
        <div class="px-6 py-4 lg:py-5 border-b border-border/60 shrink-0 hidden lg:flex justify-between items-center bg-surface/30">
          <h2 class="font-bold text-lg text-primary-dark">Keranjang & Checkout</h2>
          <span
            id="desktop-badge"
            class={`bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold ${totalQty === 0 ? "opacity-50" : ""}`}
          >
            {totalQty} item
          </span>
        </div>

        <div class="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-12" id="cart-scroll-area">
          <div id="cart-items" class="space-y-3 mb-6">
            {#if cartItems.length === 0}
              <div class="text-center py-12 flex flex-col items-center justify-center h-full">
                <div class="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary/30"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </div>
                <p class="text-[0.95rem] font-bold text-primary-dark">Keranjang Kosong</p>
                <p class="text-sm text-text-muted mt-1">Silakan pilih roti kesukaanmu.</p>
              </div>
            {/if}

            {#each cartItems as item}
              <div class="flex justify-between items-center py-3.5 border-b border-border/40 last:border-0">
                <div class="flex-1 pr-3">
                  <strong class="text-[0.95rem] block text-primary-dark leading-snug">{item.name}</strong>
                  <div class="text-[0.85rem] text-primary font-bold mt-1">
                    {formatCurrency(item.price)}
                  </div>
                </div>
                <div class="flex items-center gap-2 bg-surface border border-border/60 rounded-[12px] p-0.5 shadow-sm shrink-0">
                  <button
                    type="button"
                    class="w-8 h-8 flex items-center justify-center rounded-[10px] bg-transparent text-text-muted hover:bg-black/5 hover:text-red-500 transition-colors cursor-pointer active:scale-95"
                    onclick={() => adjustQty(item.id, -1)}
                    aria-label="Kurangi jumlah"
                  >
                    {#if item.qty === 1}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>
                    {/if}
                  </button>
                  <span class="text-[0.9rem] font-bold w-5 text-center text-primary-dark">{item.qty}</span>
                  <button
                    type="button"
                    class="w-8 h-8 flex items-center justify-center rounded-[10px] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer active:scale-95"
                    onclick={() => adjustQty(item.id, 1)}
                    aria-label="Tambah jumlah"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>

          <div id="checkout-section" class="transition-all duration-300">
            <div class="h-px w-full bg-border/40 my-6"></div>
            <div class="space-y-4">
              <h3 class="font-bold text-[0.85rem] text-primary-dark uppercase tracking-wider mb-3">Informasi Pengiriman</h3>
              <div class="space-y-4">
                <input
                  name="customer_name"
                  placeholder="Nama Penerima"
                  class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-text-muted/60 text-[0.95rem]"
                  bind:value={checkoutForm.customer_name}
                  required
                />
                <input
                  name="customer_phone"
                  type="tel"
                  placeholder="No. WhatsApp (Aktif)"
                  class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-text-muted/60 text-[0.95rem]"
                  bind:value={checkoutForm.customer_phone}
                  required
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <input
                  name="city"
                  placeholder="Kota/Kabupaten"
                  class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white outline-none text-[0.95rem] placeholder:text-text-muted/60"
                  bind:value={checkoutForm.city}
                  required
                />
                <input
                  name="district"
                  placeholder="Kecamatan"
                  class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white outline-none text-[0.95rem] placeholder:text-text-muted/60"
                  bind:value={checkoutForm.district}
                  required
                />
              </div>
              <textarea
                name="street"
                placeholder="Alamat Detail (No Rumah, Jalan, Patokan)"
                class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white outline-none min-h-[90px] resize-none text-[0.95rem] placeholder:text-text-muted/60"
                bind:value={checkoutForm.street}
                required
              ></textarea>
              <div class="grid grid-cols-2 gap-3 pb-2">
                <div>
                  <label for="delivery_date">🗓 Tanggal <span class="text-red-400">*</span></label>
                  <input id="delivery_date"
                    name="delivery_date"
                    type="date"
                    class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white outline-none text-[0.95rem]"
                    bind:value={checkoutForm.delivery_date}
                    required
                  />
                </div>
                <div>
                  <label for="delivery_time">⏱ Waktu <span class="text-red-400">*</span></label>
                  <input id="delivery_time"
                    name="delivery_time"
                    type="time"
                    class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white outline-none text-[0.95rem]"
                    bind:value={checkoutForm.delivery_time}
                    required
                  />
                </div>
              </div>
              {#if checkoutMessage}
                <div class="text-center text-sm text-red-500 font-medium px-3 py-3 bg-red-50 rounded-xl leading-snug">
                  {checkoutMessage}
                </div>
              {/if}
            </div>
          </div>
        </div>

        <div class="bg-white/95 backdrop-blur-xl px-6 py-4 lg:py-5 border-t border-border/60 shrink-0 mt-auto">
          <div class="flex justify-between items-center mb-3 text-[0.95rem]">
            <span class="text-text-muted font-medium">Total Pembayaran</span>
            <strong id="cart-total" class="font-bold text-primary-dark text-xl">
              {formatCurrency(totalAmount)}
            </strong>
          </div>
          <button
            id="main-checkout-btn"
            class="w-full h-14 rounded-2xl bg-primary text-white font-bold text-[1.05rem] shadow-[0_8px_20px_rgba(37,190,196,0.3)] hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            type="button"
            onclick={handleCheckout}
            disabled={disableCheckout}
          >
            {checkoutLoading ? "Memproses..." : checkoutButtonLabel}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </aside>
  </div>
</main>

<style>
  :global(#cart-panel.bg-opened) {
    transform: translateY(0);
  }

  :global(#cart-panel.bg-opened #cart-expanded-content) {
    opacity: 1;
  }

  :global(#cart-panel.bg-opened #floating-cart-summary) {
    opacity: 0;
    pointer-events: none;
  }

  :global(#search-input::-webkit-search-cancel-button) {
    display: none;
  }
</style>
