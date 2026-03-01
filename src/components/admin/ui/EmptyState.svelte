<script lang="ts">
let {
  icon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path></svg>`,
  title,
  description = "",
  class: className = "",
}: {
  icon?: string;
  title: string;
  description?: string;
  class?: string;
} = $props();
</script>

<div
  class="flex flex-col items-center justify-center py-12 px-6 text-center border-2 border-dashed border-stone-100 rounded-[1.5rem] bg-stone-50/50 {className}"
>
  <div
    class="w-16 h-16 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-center text-stone-300 mb-4"
  >
    {@html icon}
  </div>
  <h3 class="font-bold text-stone-900 mb-1">{title}</h3>
  <p class="text-sm text-stone-500 max-w-sm">
    {description}
  </p>
</div>
