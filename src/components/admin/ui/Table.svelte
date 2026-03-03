<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
  headers: string[];
  children?: Snippet;
  class?: string;
  [key: string]: any;
}

let { headers = [], children, class: className = "", ...rest }: Props = $props();
</script>

<div class="bg-white rounded-3xl border border-stone-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden {className}">
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm text-stone-600" {...rest}>
      {#if headers.length > 0}
        <thead class="bg-stone-50 border-b border-stone-200 uppercase text-xs font-bold text-stone-500 tracking-wider">
          <tr>
            {#each headers as header}
              <th scope="col" class="px-6 py-4">{header}</th>
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
