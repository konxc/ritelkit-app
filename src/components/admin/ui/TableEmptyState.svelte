<script lang="ts">
  import type { Snippet } from "svelte";
  import TableRow from "@/components/admin/ui/TableRow.svelte";
  import TableCell from "@/components/admin/ui/TableCell.svelte";

  interface Props {
    title: string;
    subtitle?: string;
    colspan: number;
    icon?: Snippet;
  }

  let { title, subtitle = "", colspan, icon }: Props = $props();
</script>

<TableRow>
  <TableCell {colspan} class="py-12">
    <div class="flex flex-col items-center justify-center text-center">
      <div
        class="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-stone-100 bg-stone-50 text-stone-300"
      >
        {#if icon}
          {@render icon()}
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        {/if}
      </div>
      <p class="mb-1 text-sm font-bold text-stone-900">{title}</p>
      {#if subtitle}
        <p class="max-w-[200px] text-xs text-stone-500">{subtitle}</p>
      {/if}
    </div>
  </TableCell>
</TableRow>
