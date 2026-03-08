<script lang="ts">
interface Props {
  value?: string | number;
  label?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "time" | "url" | string;
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
  "w-full px-4 py-3 rounded-xl border bg-white placeholder:text-stone-400 focus:outline-none focus:ring-[3px] transition-all duration-300 text-stone-900 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:border-stone-300 focus:shadow-md";

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

<div class="w-full space-y-1 lg:space-y-1.5">
  {#if label}
    <label for={id} class="block text-[0.8rem] font-semibold text-stone-700 lg:text-sm">
      {label}
    </label>
  {/if}

  {#if type === "number"}
    <input {id} {name} type="number" {placeholder} bind:value class={inputClasses} aria-invalid={!!error} {...rest} />
  {:else if type === "password"}
    <input {id} {name} type="password" {placeholder} bind:value class={inputClasses} aria-invalid={!!error} {...rest} />
  {:else if type === "email"}
    <input {id} {name} type="email" {placeholder} bind:value class={inputClasses} aria-invalid={!!error} {...rest} />
  {:else}
    <input {id} {name} {type} {placeholder} bind:value class={inputClasses} aria-invalid={!!error} {...rest} />
  {/if}

  {#if error}
    <p class="animate-fade-in-up text-xs font-medium text-red-500">
      {error}
    </p>
  {/if}
</div>
