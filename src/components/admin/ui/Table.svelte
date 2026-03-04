<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    headers: (string | { label: string; class?: string })[];
    children?: Snippet;
    class?: string;
    [key: string]: any;
  }

  let { headers = [], children, class: className = "", ...rest }: Props = $props();
</script>

<div
  class="overflow-hidden rounded-3xl border border-stone-200/60 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.02)] {className}"
>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm text-stone-600" {...rest}>
      {#if headers.length > 0}
        <thead
          class="border-b border-stone-200/80 bg-stone-50/50 text-xs font-bold tracking-widest text-[#9c8973] uppercase"
        >
          <tr
            class="group/tr relative transition-all duration-300 hover:bg-stone-50/80 lg:hover:bg-gradient-to-r lg:hover:from-white lg:hover:to-[#c48a3a]/5"
          >
            {#each headers as header}
              {@const label = typeof header === "string" ? header : header.label}
              {@const hClass = typeof header === "string" ? "" : header.class || ""}
              <th scope="col" class="px-3 py-3 text-center lg:px-6 lg:py-4 {hClass}">{label}</th>
            {/each}
          </tr>
        </thead>
      {/if}
      <tbody class="divide-y divide-stone-100">
        {#if children}
          {@render children()}
        {/if}
      </tbody>
    </table>
  </div>
</div>
