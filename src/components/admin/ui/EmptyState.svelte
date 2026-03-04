<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    description?: string;
    icon?: Snippet;
    class?: string;
    [key: string]: any;
  }

  let { title, description = "", icon, class: className = "", ...rest }: Props = $props();
</script>

<div
  class="flex flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-stone-100 bg-stone-50/50 px-6 py-12 text-center {className}"
  {...rest}
>
  {#if icon}
    <div
      class="mb-4 flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-stone-200/50 bg-gradient-to-br from-white to-stone-50/50 text-[#c48a3a]/40 shadow-sm"
    >
      {@render icon()}
    </div>
  {/if}

  <h3 class="mb-1 font-bold text-stone-900">{title}</h3>

  {#if description}
    <p class="max-w-sm text-sm text-stone-500">
      {description}
    </p>
  {/if}
</div>
