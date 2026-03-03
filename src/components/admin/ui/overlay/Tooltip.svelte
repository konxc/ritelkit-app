<script lang="ts">
interface Props {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  variant?: "dark" | "danger";
  class?: string;
  children?: import("svelte").Snippet;
  [key: string]: any;
}

let {
  text,
  position = "top",
  variant = "dark",
  class: className = "",
  children,
  ...rest
}: Props = $props();

let positionClasses = $derived.by(() => {
  switch (position) {
    case "bottom":
      return "top-full mt-3 flex-col";
    case "left":
      return "right-full mr-3 flex-row-reverse";
    case "right":
      return "left-full ml-3 flex-row";
    default:
      return "bottom-full mb-3 flex-col-reverse";
  }
});

let variantConfig = $derived.by(() => {
  switch (variant) {
    case "danger":
      return {
        bg: "bg-red-600",
        arrowCol: "bg-red-600",
        textClass: "text-white font-bold",
      };
    default:
      return {
        bg: "bg-stone-900",
        arrowCol: "bg-stone-900",
        textClass: "text-white font-semibold",
      };
  }
});
</script>

<div class="relative group flex justify-center {className}" {...rest}>
  {#if children}
    {@render children()}
  {/if}

  <div class="absolute {positionClasses} hidden group-hover:flex items-center animate-fade-in-up z-50 pointer-events-none">
    {#if position === 'top' || position === 'left'}
      <span class="relative z-10 px-3 py-1.5 text-xs leading-none whitespace-nowrap rounded-lg shadow-lg {variantConfig.bg} {variantConfig.textClass}">
        {text}
      </span>
      <div class="w-3 h-3 bg-stone-900 rotate-45 rounded-sm {variantConfig.arrowCol} {position === 'top' ? '-mt-1.5' : '-ml-1.5'} z-0"></div>
    {/if}

    {#if position === 'bottom' || position === 'right'}
      <div class="w-3 h-3 bg-stone-900 rotate-45 rounded-sm {variantConfig.arrowCol} {position === 'bottom' ? '-mb-1.5 border-t border-l' : '-mr-1.5'} z-0"></div>
      <span class="relative z-10 px-3 py-1.5 text-xs leading-none whitespace-nowrap rounded-lg shadow-lg {variantConfig.bg} {variantConfig.textClass}">
        {text}
      </span>
    {/if}
  </div>
</div>
