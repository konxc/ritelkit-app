<script lang="ts">
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  stock: number;
}

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
    class="group bg-white rounded-[20px] p-3 shadow-sm border border-border/60 hover:border-primary/30 transition-all flex md:flex-col gap-4"
>
    <div
        class="relative w-[110px] h-[110px] md:w-full md:h-auto md:aspect-[4/3] shrink-0 rounded-2xl overflow-hidden bg-surface flex justify-center items-center"
    >
        {#if product.image}
            <img
                src={product.image}
                alt={product.name}
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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
                ><rect
                    width="18"
                    height="18"
                    x="3"
                    y="3"
                    rx="2"
                    ry="2"
                /><circle cx="9" cy="9" r="2" /><path
                    d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
                /></svg
            >
        {/if}
    </div>
    <div
        class="flex-1 flex flex-col justify-between py-1 md:py-0 w-full min-w-0"
    >
        <div>
            <h3
                class="text-[1rem] md:text-[1.1rem] font-bold text-primary-dark leading-snug line-clamp-2 md:mb-1"
            >
                {product.name}
            </h3>
            <p
                class="text-[0.8rem] text-text-muted line-clamp-2 leading-relaxed hidden md:-webkit-box mt-0.5"
            >
                {product.description}
            </p>
        </div>
        <div class="flex justify-between items-center mt-3 gap-2">
            <span
                class="font-bold text-primary text-[0.95rem] md:text-[1.05rem]"
            >
                Rp {Number(product.price).toLocaleString("id-ID")}
            </span>
            <button
                onclick={handleClick}
                class="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl transition-all active:scale-95 {isAdded
                    ? 'bg-primary text-white'
                    : 'bg-primary/10 text-primary'}"
                aria-label="Tambah item"
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
                        stroke-linejoin="round"
                        ><path d="M20 6 9 17l-5-5" /></svg
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
                        stroke-linejoin="round"
                        ><path d="M5 12h14" /><path d="M12 5v14" /></svg
                    >
                {/if}
            </button>
        </div>
    </div>
</div>
