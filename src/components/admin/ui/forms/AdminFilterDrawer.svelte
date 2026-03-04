<script lang="ts">
  import Drawer from "../overlay/Drawer.svelte";
  import Button from "../Button.svelte";
  import type { Snippet } from "svelte";

  let {
    isOpen = $bindable(false),
    title = "Filter Lanjutan",
    children,
    onApply,
  }: {
    isOpen: boolean;
    title?: string;
    children: Snippet;
    onApply?: () => void;
  } = $props();

  function handleApply() {
    onApply?.();
    isOpen = false;
  }
</script>

<Drawer bind:isOpen {title} maxWidth="sm">
  <div class="flex h-full flex-col">
    <div class="flex-1 space-y-6 p-6">
      {@render children()}
    </div>

    <div class="border-t border-stone-100 bg-stone-50/50 p-6">
      <div class="flex gap-3">
        <Button variant="simple" class="flex-1 font-bold" onclick={() => (isOpen = false)}>Batal</Button>
        <Button variant="primary" class="flex-1 font-bold" onclick={handleApply}>Terapkan Filter</Button>
      </div>
    </div>
  </div>
</Drawer>
