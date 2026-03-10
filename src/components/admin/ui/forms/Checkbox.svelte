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

<div class="flex w-full items-start gap-3">
  <div class="mt-0.5 flex h-5 items-center">
    <input
      {id}
      {name}
      type="checkbox"
      bind:checked
      {disabled}
      class="h-4.5 w-4.5 cursor-pointer rounded-md border-stone-300 bg-white text-[#c48a3a] shadow-sm transition-all focus:ring-[3px] focus:ring-[#c48a3a]/20 {className}"
      {...rest}
    />
  </div>
  {#if label}
    <div class="flex flex-col"></div>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</div>
