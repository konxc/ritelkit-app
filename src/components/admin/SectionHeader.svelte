<script lang="ts">
let {
  title,
  badge,
  muted,
}: {
  title: string;
  badge?: string;
  muted?: string;
} = $props();
</script>

<div class="flex flex-col gap-1.5 mb-2">
  <div class="flex items-center gap-3">
    <h2 class="text-xl font-extrabold tracking-tight text-stone-800">{title}</h2>
    {#if badge}
      <span class="px-2.5 py-1 rounded-md bg-[#c48a3a]/10 text-[#c48a3a] text-[0.65rem] font-bold uppercase tracking-widest">{badge}</span>
    {/if}
  </div>
  {#if muted && !badge}
    <p class="text-[0.85rem] font-medium text-stone-500 max-w-2xl">{muted}</p>
  {/if}
</div>
