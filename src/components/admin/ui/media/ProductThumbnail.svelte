<script lang="ts">
  import { t } from "@lib/i18n/store.svelte";
  interface Props {
    src?: string;
    alt?: string;
    isEmpty?: boolean;
    class?: string;
    [key: string]: any;
  }

  let {
    src = "",
    alt = t("catalog.products.photo"),
    isEmpty = false,
    class: className = "",
    ...rest
  }: Props = $props();
</script>

<div
  class="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border transition-colors {isEmpty
    ? 'flex flex-col items-center justify-center border-dashed border-stone-200 bg-stone-50 text-stone-400 hover:border-[#c48a3a]/30'
    : 'border-stone-200/50 bg-stone-100 shadow-sm'} {className}"
  {...rest}
>
  {#if isEmpty}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="mb-2 transition-all group-hover:scale-110 group-hover:text-[#c48a3a]"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
      <circle cx="9" cy="9" r="2"></circle>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
    </svg>
    <span class="text-xs font-medium">{t("catalog.products.upload_photo")}</span>
  {:else if src}
    <img {src} {alt} class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
    <div class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
      <div
        class="flex h-10 w-10 translate-y-4 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
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
          class="text-stone-800"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg
        >
      </div>
    </div>
  {:else}
    <div class="flex h-full w-full items-center justify-center text-stone-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path
          d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
        ></path></svg
      >
    </div>
  {/if}
</div>
