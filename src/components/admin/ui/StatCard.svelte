<script lang="ts">
  import type { Snippet } from "svelte";
  import Card from "./Card.svelte";

  interface Props {
    label: string;
    value: string | number;
    trend?: string;
    trendType?: "up" | "down" | "neutral";
    icon?: Snippet;
    class?: string;
    [key: string]: any;
  }

  let { label, value, trend = "", trendType = "neutral", icon, class: className = "", ...rest }: Props = $props();

  let trendColor = $derived.by(() => {
    switch (trendType) {
      case "up":
        return "text-emerald-700 bg-emerald-100/80 border border-emerald-200/50";
      case "down":
        return "text-rose-700 bg-rose-100/80 border border-rose-200/50";
      default:
        return "text-stone-500 bg-stone-100 border border-stone-200/50";
    }
  });
</script>

<Card hover={true} class="flex flex-col {className}" {...rest}>
  {#if icon}
    <div
      class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-200/60 bg-gradient-to-br from-stone-50 to-stone-100/50 text-[#c48a3a] shadow-sm"
    >
      {@render icon()}
    </div>
  {/if}

  <p class="mb-1 text-sm font-semibold tracking-wide text-stone-500 uppercase">
    {label}
  </p>

  <div class="flex items-end gap-3">
    <h3 class="font-['Syne',sans-serif] text-3xl font-extrabold text-stone-900">
      {value}
    </h3>

    {#if trend}
      <span class="text-xs font-bold {trendColor} mb-1 rounded-md px-2 py-1">
        {trend}
      </span>
    {/if}
  </div>
</Card>
