<script lang="ts">
interface Props {
  src?: string;
  alt?: string;
  isEmpty?: boolean;
  class?: string;
  [key: string]: any;
}

let {
  src = "",
  alt = "Product Thumbnail",
  isEmpty = false,
  class: className = "",
  ...rest
}: Props = $props();
</script>

<div class="aspect-square rounded-2xl border transition-colors cursor-pointer overflow-hidden relative group {isEmpty ? 'bg-stone-50 border-stone-200 border-dashed hover:border-[#c48a3a]/30 flex flex-col items-center justify-center text-stone-400' : 'bg-stone-100 border-stone-200/50 shadow-sm'} {className}" {...rest}>
  {#if isEmpty}
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-2 group-hover:scale-110 group-hover:text-[#c48a3a] transition-all">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
      <circle cx="9" cy="9" r="2"></circle>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
    </svg>
    <span class="text-xs font-medium">Unggah Foto</span>
  {:else if src}
    <img {src} {alt} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
      <div class="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-800"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
      </div>
    </div>
  {:else}
    <div class="w-full h-full flex items-center justify-center text-stone-300">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
    </div>
  {/if}
</div>
