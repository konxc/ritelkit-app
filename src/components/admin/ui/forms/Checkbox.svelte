<script lang="ts">
interface Props {
  checked?: boolean;
  label?: string;
  id?: string;
  name?: string;
  class?: string;
  disabled?: boolean;
  children?: import("svelte").Snippet;
  [key: string]: any;
}

let {
  checked = $bindable(false),
  label = "",
  id = "",
  name = "",
  class: className = "",
  disabled = false,
  children,
  ...rest
}: Props = $props();
</script>

<div class="flex items-start gap-3 w-full">
  <div class="flex items-center h-5 mt-0.5">
    <input
      {id}
      {name}
      type="checkbox"
      bind:checked
      {disabled}
      class="w-4 h-4 text-[#c48a3a] bg-white border-stone-300 rounded focus:ring-[#c48a3a] focus:ring-2 cursor-pointer transition-all {className}"
      {...rest}
    />
  </div>
  {#if label}
    <div class="flex flex-col">
    </div>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</div>
