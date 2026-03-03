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

let {
  label,
  value,
  trend = "",
  trendType = "neutral",
  icon,
  class: className = "",
  ...rest
}: Props = $props();

let trendColor = $derived.by(() => {
  switch (trendType) {
    case "up":
      return "text-green-600 bg-green-50";
    case "down":
      return "text-red-600 bg-red-50";
    default:
      return "text-stone-500 bg-stone-50";
  }
});
</script>

<Card hover={true} class="flex flex-col {className}" {...rest}>
  {#if icon}
    <div class="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-[#c48a3a] mb-4">
      {@render icon()}
    </div>
  {/if}
  
  <p class="text-sm font-semibold tracking-wide text-stone-500 uppercase mb-1">
    {label}
  </p>
  
  <div class="flex items-end gap-3">
    <h3 class="font-['Syne',sans-serif] text-3xl font-extrabold text-stone-900">
      {value}
    </h3>
    
    {#if trend}
      <span class="text-xs font-bold {trendColor} px-2 py-1 rounded-md mb-1">
        {trend}
      </span>
    {/if}
  </div>
</Card>
