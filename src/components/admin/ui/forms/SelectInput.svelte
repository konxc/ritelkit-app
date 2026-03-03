<script lang="ts">
interface Option {
  label: string;
  value: string | number;
}

interface Props {
  value?: string | number;
  label?: string;
  options?: Option[];
  placeholder?: string;
  error?: string;
  id?: string;
  name?: string;
  class?: string;
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
  ...rest
}: Props = $props();

const baseSelectClasses =
  "w-full px-4 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all text-stone-900 appearance-none cursor-pointer";

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
</script>

<div class="space-y-1.5 w-full relative">
  {#if label}
    <label for={id} class="block text-sm font-semibold text-stone-700">
      {label}
    </label>
  {/if}
  
  <div class="relative">
    <select
      {id}
      {name}
      bind:value
      class={selectClasses}
      aria-invalid={!!error}
      {...rest}
    >
      {#if placeholder}
        <option value="" disabled selected={!value}>{placeholder}</option>
      {/if}
      
      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
    
    <!-- Custom Dropdown Caret -->
    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-400">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </div>
  </div>
  
  {#if error}
    <p class="text-xs text-red-500 font-medium animate-fade-in-up">
      {error}
    </p>
  {/if}
</div>
