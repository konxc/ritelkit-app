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
      checked ? "bg-[#c48a3a] shadow-[0_0_12px_rgba(196,138,58,0.2)]" : "bg-stone-200",
      disabled ? "opacity-50 cursor-not-allowed" : "",
      className,
    ]
      .filter(Boolean)
      .join(" "),
  );

  let thumbClasses = $derived(
    [
      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
      checked ? "translate-x-5 scale-110 shadow-md" : "translate-x-0 scale-90",
    ]
      .filter(Boolean)
      .join(" "),
  );
  const handleToggle = () => {
    if (!disabled) checked = !checked;
  };
</script>

<label for={id} class="flex cursor-pointer items-center {disabled ? 'cursor-not-allowed opacity-50' : ''}">
  <button
    type="button"
    {id}
    {name}
    role="switch"
    aria-checked={checked}
    {disabled}
    onclick={handleToggle}
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
