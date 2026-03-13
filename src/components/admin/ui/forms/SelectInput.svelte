<script lang="ts">
  import { t } from "../../../../lib/i18n/store.svelte";

  interface Option {
    label: string;
    value: string | number | boolean;
  }

  interface Props {
    value?: string | number | boolean;
    label?: string;
    options?: Option[];
    placeholder?: string;
    error?: string;
    id?: string;
    name?: string;
    class?: string;
    onchange?: (e: Event) => void;
    children?: import("svelte").Snippet;
    [key: string]: any;
  }

  let {
    value = $bindable(""),
    label = "",
    options = [],
    placeholder = "",
    error = "",
    id = "",
    name = "",
    class: className = "",
    onchange,
    children,
    ...rest
  }: Props = $props();

  const baseSelectClasses =
    "w-full px-4 py-2.5 text-[0.85rem] lg:text-sm rounded-2xl border bg-white focus:outline-none focus:ring-[3px] transition-all duration-300 text-stone-800 font-semibold appearance-none cursor-pointer shadow-sm hover:border-stone-300 focus:shadow-md";

  let selectClasses = $derived(
    [
      baseSelectClasses,
      error
        ? "border-red-300 bg-red-50/50 text-red-900 focus:ring-red-500/30 focus:border-red-500"
        : "border-stone-200 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a]",
      className,
    ]
      .filter(Boolean)
      .join(" "),
  );

  let defaultPlaceholder = $derived(placeholder || (label ? `${t("common.select")} ${label}...` : ""));
</script>

<div class="relative w-full space-y-1 lg:space-y-1.5">
  {#if label}
    <label for={id} class="block text-[0.8rem] font-semibold text-stone-700 lg:text-sm">
      {label}
    </label>
  {/if}

  <div class="relative">
    <select {id} {name} bind:value {onchange} class={selectClasses} aria-invalid={!!error} {...rest}>
      {#if defaultPlaceholder}
        <option value="" disabled selected={!value}>{defaultPlaceholder}</option>
      {/if}

      {@render children?.()}

      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>

    <!-- Custom Dropdown Caret -->
    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  </div>

  {#if error}
    <p class="animate-fade-in-up text-xs font-medium text-red-500">
      {error}
    </p>
  {/if}
</div>
