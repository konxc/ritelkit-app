<script lang="ts">
import AsidePane from "./AsidePane.svelte";
import TableOfContents from "../navigation/TableOfContents.svelte";

interface Props {
  items: { id: string; label: string }[];
  title?: string;
  side?: "left" | "right";
  isOpen?: boolean;
}

let { items, title = "Navigasi", side = "right", isOpen = $bindable(false) }: Props = $props();
</script>

<AsidePane {title} {side} bind:isOpen>
  <TableOfContents {items} onItemClick={() => (isOpen = false)} />
</AsidePane>
