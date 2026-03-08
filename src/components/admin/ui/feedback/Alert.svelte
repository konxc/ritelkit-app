<script lang="ts">
interface Props {
  variant?: "success" | "warning" | "error" | "info";
  title?: string;
  message?: string;
  class?: string;
  children?: import("svelte").Snippet;
  [key: string]: any;
}

let {
  variant = "info",
  title = "",
  message = "",
  class: className = "",
  children,
  ...rest
}: Props = $props();

let alertConfig = $derived.by(() => {
  switch (variant) {
    case "success":
      return {
        bg: "bg-green-50",
        border: "border-green-100",
        text: "text-green-900",
        iconColor: "text-green-500",
        descText: "text-green-800/80",
        icon: `<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>`,
      };
    case "warning":
      return {
        bg: "bg-yellow-50",
        border: "border-yellow-100",
        text: "text-yellow-900",
        iconColor: "text-yellow-600",
        descText: "text-yellow-800/80",
        icon: `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`,
      };
    case "error":
      return {
        bg: "bg-red-50",
        border: "border-red-100",
        text: "text-red-900",
        iconColor: "text-red-500",
        descText: "text-red-800/80",
        icon: `<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`,
      };
    default:
      return {
        bg: "bg-blue-50",
        border: "border-blue-100",
        text: "text-blue-900",
        iconColor: "text-blue-500",
        descText: "text-blue-800/80",
        icon: `<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>`,
      };
  }
});
</script>

<div
  class="flex items-start gap-3 p-4 {alertConfig.bg} border {alertConfig.border} rounded-2xl {alertConfig.text} {className}"
  {...rest}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="{alertConfig.iconColor} mt-0.5 shrink-0"
  >
    {@html alertConfig.icon}
  </svg>
  <div>
    {#if title}
      <h4 class="mb-0.5 text-sm font-bold">{title}</h4>
    {/if}

    {#if message}
      <p class="text-sm {alertConfig.descText}">
        {message}
      </p>
    {/if}

    {#if children}
      <div class="text-sm {alertConfig.descText} {title || message ? 'mt-1' : ''}">
        {@render children()}
      </div>
    {/if}
  </div>
</div>
