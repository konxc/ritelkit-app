<script lang="ts">
  interface Props {
    width?: string;
    height?: string;
    rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
    animation?: "pulse" | "none";
    class?: string;
    [key: string]: any;
  }

  let {
    width = "w-full",
    height = "h-4",
    rounded = "full",
    animation = "pulse",
    class: className = "",
    ...rest
  }: Props = $props();

  let roundedClasses = $derived.by(() => {
    switch (rounded) {
      case "none":
        return "rounded-none";
      case "sm":
        return "rounded-sm";
      case "md":
        return "rounded-md";
      case "lg":
        return "rounded-lg";
      case "xl":
        return "rounded-xl";
      case "2xl":
        return "rounded-2xl";
      case "3xl":
        return "rounded-3xl";
      case "full":
        return "rounded-full";
      default:
        return "rounded-full";
    }
  });
</script>

<div
  class="{width} {height} {roundedClasses} bg-stone-100/80 {animation === 'pulse' ? 'animate-pulse' : ''} {className}"
  {...rest}
></div>
