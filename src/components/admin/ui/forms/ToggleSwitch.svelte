<script lang="ts">
interface Props {
  checked?: boolean;
  label?: string;
  id?: string;
  name?: string;
  class?: string;
  disabled?: boolean;
  [key: string]: any;
}

let {
  checked = $bindable(false),
  label = "",
  id = "",
  name = "",
  class: className = "",
  disabled = false,
  ...rest
}: Props = $props();

let switchClasses = $derived(
  [
    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#c48a3a] focus:ring-offset-2",
    checked ? "bg-[#c48a3a]" : "bg-stone-200",
    disabled ? "opacity-50 cursor-not-allowed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" "),
);

let thumbClasses = $derived(
  [
    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
    checked ? "translate-x-5" : "translate-x-0",
  ]
    .filter(Boolean)
    .join(" "),
);
</script>

<label for={id} class="flex items-center cursor-pointer {disabled ? 'opacity-50 cursor-not-allowed' : ''}">
  <button
    type="button"
    {id}
    {name}
    role="switch"
    aria-checked={checked}
    {disabled}
    onclick={() => {
      if (!disabled) checked = !checked;
    }}
    class={switchClasses}
    {...rest}
  >
    <span class="sr-only">Toggle {label}</span>
    <span aria-hidden="true" class={thumbClasses}></span>
  </button>
  
  {#if label}
    <span class="ml-3 text-sm font-medium text-stone-700">
      {label}
    </span>
  {/if}
</label>
