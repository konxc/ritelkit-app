<script lang="ts">
let {
  label,
  value,
  icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  trend = null,
}: {
  label: string;
  value: string | number;
  icon?: string;
  trend?: { value: string; isPositive: boolean } | null;
} = $props();
</script>

<div
  class="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-shadow"
>
  <div
    class="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-[#c48a3a] mb-4"
  >
    {@html icon}
  </div>
  <p
    class="text-sm font-semibold tracking-wide text-stone-500 uppercase mb-1"
  >
    {label}
  </p>
  <div class="flex items-end gap-3">
    <h3 class="font-['Syne',sans-serif] text-3xl font-extrabold text-stone-900">
      {value}
    </h3>
    {#if trend}
      <span
        class="text-xs font-bold px-2 py-1 rounded-md mb-1 {trend.isPositive
          ? 'text-green-600 bg-green-50'
          : 'text-red-600 bg-red-50'}"
      >
        {trend.isPositive ? "+" : ""}{trend.value}
      </span>
    {/if}
  </div>
</div>
