<script lang="ts">
interface Props {
  variant?: "success" | "warning" | "info" | "default" | "danger";
  showDot?: boolean;
  class?: string;
  children?: import("svelte").Snippet;
  [key: string]: any;
}

let {
  variant = "default",
  showDot = false,
  class: className = "",
  children,
  ...rest
}: Props = $props();

const variantClasses = {
  success: "bg-green-50 text-green-700 border border-green-200",
  warning: "bg-[#c48a3a]/10 text-[#a6722d] border border-[#c48a3a]/30",
  info: "bg-blue-50 text-blue-700 border border-blue-200",
  default: "bg-stone-100 text-stone-600 border border-stone-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
};

const dotColors = {
  success: "bg-green-500",
  warning: "bg-[#c48a3a]",
  info: "bg-blue-500",
  default: "bg-stone-400",
  danger: "bg-red-500",
};

const baseClasses =
  "inline-flex items-center px-2.5 py-1.5 rounded-full text-[0.7rem] font-black tracking-wide uppercase shadow-sm";

let computedClasses = $derived(
  [
    baseClasses,
    variantClasses[variant],
    (variant === "warning" || variant === "danger") && "animate-pulse-subtle",
    className,
  ]
    .filter(Boolean)
    .join(" "),
);
</script>

<span class={computedClasses} {...rest}>
  {#if showDot}
    <span class="h-1.5 w-1.5 rounded-full {dotColors[variant]} mr-1.5"></span>
  {/if}
  {@render children?.()}
</span>

<style>
  :global(.animate-pulse-subtle) {
    animation: pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse-subtle {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.85;
    }
  }
</style>
