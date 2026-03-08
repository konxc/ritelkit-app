<script lang="ts">
import type { HTMLButtonAttributes, HTMLAnchorAttributes } from "svelte/elements";

interface Props {
  variant?: "primary" | "outline" | "secondary" | "simple" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon" | "icon-sm";
  class?: string;
  href?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  children?: import("svelte").Snippet;
  [key: string]: any;
}

let {
  variant = "primary",
  size = "md",
  class: className = "",
  href = undefined,
  disabled = false,
  type = "button",
  children,
  ...rest
}: Props = $props();

const baseClasses =
  "inline-flex items-center justify-center font-semibold transition-all focus:outline-none";

const variantClasses = {
  primary:
    "bg-gradient-to-r from-[#c48a3a] to-[#a6722d] text-white shadow-[0_8px_16px_rgba(196,138,58,0.25)] hover:-translate-y-0.5",
  outline: "border-2 border-[#c48a3a] text-[#c48a3a] hover:bg-[#c48a3a]/5",
  secondary: "bg-stone-900 text-white shadow-md hover:-translate-y-0.5",
  simple:
    "border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:border-stone-300 hover:shadow-sm shadow-sm",
  ghost: "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900",
  danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white",
};

const sizeClasses = {
  sm: "px-4 py-2 text-[0.85rem] rounded-xl gap-2.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-[0.95rem] rounded-2xl gap-2 font-bold",
  icon: "w-10 h-10 rounded-xl flex items-center justify-center p-0",
  "icon-sm": "w-8 h-8 rounded-lg flex items-center justify-center p-0",
};

const disabledClasses =
  "opacity-50 cursor-not-allowed hover:-translate-y-0 shadow-none pointer-events-none";

let computedClasses = $derived(
  [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled ? disabledClasses : "cursor-pointer",
    className,
  ]
    .filter(Boolean)
    .join(" "),
);
</script>

{#if href}
  <a {href} class={computedClasses} {...rest} aria-disabled={disabled}>
    {@render children?.()}
  </a>
{:else}
  <button {type} {disabled} class={computedClasses} {...rest}>
    {@render children?.()}
  </button>
{/if}
