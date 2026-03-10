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

<div class="mb-2 flex flex-col gap-1.5">
  <div class="flex items-center gap-3">
    <h2 class="text-xl font-extrabold tracking-tight text-stone-800">{title}</h2>
    {#if badge}
      <span
        class="rounded-md bg-[#c48a3a]/10 px-2.5 py-1 text-[0.65rem] font-bold tracking-widest text-[#c48a3a] uppercase"
        >{badge}</span
      >
    {/if}
  </div>
  {#if muted && !badge}
    <p class="max-w-2xl text-[0.85rem] font-medium text-stone-500">
      {@html muted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}
    </p>
  {/if}
</div>
