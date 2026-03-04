<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    padding?: "none" | "sm" | "md" | "lg";
    hover?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: any;
  }

  let { padding = "md", hover = false, class: className = "", children, ...rest }: Props = $props();

  let paddingClasses = $derived.by(() => {
    switch (padding) {
      case "none":
        return "";
      case "sm":
        return "p-4";
      case "lg":
        return "p-8";
      default:
        return "p-6";
    }
  });
</script>

<div
  class="rounded-3xl border border-stone-200/60 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] {paddingClasses} {hover
    ? 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]'
    : ''} {className}"
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</div>
