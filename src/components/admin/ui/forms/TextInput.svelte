<script lang="ts">
interface Props {
  value?: string;
  label?: string;
  type?: "text" | "email" | "password" | "number" | "tel";
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
  type = "text",
  placeholder = "",
  error = "",
  id = "",
  name = "",
  class: className = "",
  ...rest
}: Props = $props();

const baseInputClasses =
  "w-full px-4 py-2.5 rounded-xl border bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-all text-stone-900";

let inputClasses = $derived(
  [
    baseInputClasses,
    error
      ? "border-red-300 bg-red-50/50 text-red-900 focus:ring-red-500/30 focus:border-red-500"
      : "border-stone-200 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a]",
    className,
  ]
    .filter(Boolean)
    .join(" "),
);
</script>

<div class="space-y-1.5 w-full">
  {#if label}
    <label for={id} class="block text-sm font-semibold text-stone-700">
      {label}
    </label>
  {/if}
  
  <input
    {id}
    {name}
    {type}
    {placeholder}
    bind:value
    class={inputClasses}
    aria-invalid={!!error}
    {...rest}
  />
  
  {#if error}
    <p class="text-xs text-red-500 font-medium animate-fade-in-up">
      {error}
    </p>
  {/if}
</div>
