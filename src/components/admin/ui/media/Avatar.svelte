<script lang="ts">
interface Props {
  src?: string;
  alt?: string;
  initials?: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy" | "away";
  class?: string;
  [key: string]: any;
}

let {
  src = "",
  alt = "Avatar Pengguna",
  initials = "",
  size = "md",
  status,
  class: className = "",
  ...rest
}: Props = $props();

let sizeConfig = $derived.by(() => {
  switch (size) {
    case "sm":
      return { wrapper: "w-8 h-8 text-xs", indicator: "w-2.5 h-2.5" };
    case "lg":
      return { wrapper: "w-16 h-16 text-xl", indicator: "w-4 h-4" };
    case "xl":
      return { wrapper: "w-20 h-20 text-2xl", indicator: "w-5 h-5" };
    default:
      return { wrapper: "w-12 h-12 text-sm", indicator: "w-3 h-3" };
  }
});

let statusColor = $derived.by(() => {
  if (!status) return "";
  switch (status) {
    case "offline":
      return "bg-stone-300";
    case "busy":
      return "bg-red-500";
    case "away":
      return "bg-yellow-500";
    default:
      return "bg-green-500";
  }
});
</script>

<div class="relative inline-block {className}" {...rest}>
  <div
    class="{sizeConfig.wrapper} flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-stone-100 font-bold text-stone-500 shadow-sm"
  >
    {#if src}
      <img {src} {alt} class="h-full w-full object-cover" />
    {:else if initials}
      {initials}
    {:else}
      <!-- Fallback icon if neither src nor initials are provided -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="50%"
        height="50%"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-stone-400"
      >
        <circle cx="12" cy="8" r="5"></circle>
        <path d="M20 21a8 8 0 0 0-16 0"></path>
      </svg>
    {/if}
  </div>

  {#if status}
    <span class="absolute right-0 bottom-0 {sizeConfig.indicator} rounded-full {statusColor} border-2 border-white"
    ></span>
  {/if}
</div>
