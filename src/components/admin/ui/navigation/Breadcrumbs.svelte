<script lang="ts">
  interface BreadcrumbItem {
    label: string;
    href?: string;
  }

  interface Props {
    items?: BreadcrumbItem[];
    class?: string;
    [key: string]: any;
  }

  let { items = [], class: className = "", ...rest }: Props = $props();
</script>

<nav class="flex space-x-2 text-sm font-medium text-stone-500 {className}" aria-label="Breadcrumb" {...rest}>
  {#each items as item, i}
    {#if item.href && i !== items.length - 1}
      <a href={item.href} class="transition-colors hover:text-stone-900">
        {item.label}
      </a>
    {:else}
      <span class="font-bold text-stone-900" aria-current="page">
        {item.label}
      </span>
    {/if}

    {#if i !== items.length - 1}
      <span class="text-stone-300" aria-hidden="true">/</span>
    {/if}
  {/each}
</nav>
