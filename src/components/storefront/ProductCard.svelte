<script lang="ts">
  interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string;
    stock: number;
  }

  import { t, i18n } from "@lib/i18n/store.svelte";

  let { product, onAdd } = $props<{ product: Product; onAdd: () => void }>();

  let isAdded = $state(false);

  function handleClick() {
    onAdd();
    isAdded = true;
    setTimeout(() => {
      isAdded = false;
    }, 600);
  }
</script>

<div
  class="group border-border/60 hover:border-primary/30 flex gap-4 rounded-[20px] border bg-white p-3 shadow-sm transition-all md:flex-col"
>
  <div
    class="bg-surface relative flex h-[110px] w-[110px] shrink-0 items-center justify-center overflow-hidden rounded-2xl md:aspect-[4/3] md:h-auto md:w-full"
  >
    {#if product.image}
      <img
        src={product.image}
        alt={product.name}
        class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        class="text-primary/20"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path
          d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
        /></svg
      >
    {/if}
  </div>
  <div class="flex w-full min-w-0 flex-1 flex-col justify-between py-1 md:py-0">
    <div>
      <h3 class="text-primary-dark line-clamp-2 text-[1rem] leading-snug font-bold md:mb-1 md:text-[1.1rem]">
        {product.name}
      </h3>
      <p class="text-text-muted md:-webkit-box mt-0.5 line-clamp-2 hidden text-[0.8rem] leading-relaxed">
        {product.description}
      </p>
    </div>
    <div class="mt-3 flex items-center justify-between gap-2">
      <span class="text-primary text-[0.95rem] font-bold md:text-[1.05rem]">
        {i18n.f.currency(product.price)}
      </span>
      <button
        onclick={handleClick}
        class="flex h-8 w-8 items-center justify-center rounded-xl transition-all active:scale-95 md:h-9 md:w-9 {isAdded
          ? 'bg-primary text-white'
          : 'bg-primary/10 text-primary'}"
        aria-label={t("common.add_item")}
      >
        {#if isAdded}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg
          >
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
          >
        {/if}
      </button>
    </div>
  </div>
</div>
