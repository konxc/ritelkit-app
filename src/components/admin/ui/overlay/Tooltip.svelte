<script lang="ts">
  interface Props {
    text: string;
    position?: "top" | "bottom" | "left" | "right";
    variant?: "dark" | "danger";
    class?: string;
    children?: import("svelte").Snippet;
    [key: string]: any;
  }

  let { text, position = "top", variant = "dark", class: className = "", children, ...rest }: Props = $props();

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
          border: "border-red-500",
        };
      default:
        return {
          bg: "bg-stone-900/95",
          arrowCol: "bg-stone-900/95",
          textClass: "text-white font-medium",
          border: "border-white/10",
        };
    }
  });
</script>

<div class="group relative flex justify-center {className}" {...rest}>
  {#if children}
    {@render children()}
  {/if}

  <div
    class="absolute {positionClasses} animate-fade-in-up pointer-events-none z-50 hidden items-center group-hover:flex"
  >
    {#if position === "top" || position === "left"}
      <span
        class="relative z-10 rounded-lg border px-3 py-1.5 text-xs leading-none whitespace-nowrap shadow-xl backdrop-blur-sm {variantConfig.bg} {variantConfig.textClass} {variantConfig.border}"
      >
        {text}
      </span>
      <div
        class="h-3 w-3 rotate-45 rounded-sm bg-stone-900 transition-colors {variantConfig.arrowCol} {position === 'top'
          ? '-mt-1.5'
          : '-ml-1.5'} z-0"
      ></div>
    {/if}

    {#if position === "bottom" || position === "right"}
      <div
        class="h-3 w-3 rotate-45 rounded-sm bg-stone-900 transition-colors {variantConfig.arrowCol} {position ===
        'bottom'
          ? '-mb-1.5 border-t border-l'
          : '-mr-1.5'} z-0"
      ></div>
      <span
        class="relative z-10 rounded-lg border px-3 py-1.5 text-xs leading-none whitespace-nowrap shadow-xl backdrop-blur-sm {variantConfig.bg} {variantConfig.textClass} {variantConfig.border}"
      >
        {text}
      </span>
    {/if}
  </div>
</div>
