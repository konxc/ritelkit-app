<script lang="ts">
  import Drawer from "../overlay/Drawer.svelte";
  import Button from "../Button.svelte";
  import type { Snippet } from "svelte";

  let {
    isOpen = $bindable(false),
    title = "Filter Lanjutan",
    subtitle,
    icon,
    children,
    onApply,
  }: {
    isOpen: boolean;
    title?: string;
    subtitle?: string;
    icon?: Snippet;
    children: Snippet;
    onApply?: () => void;
  } = $props();

  function handleApply() {
    onApply?.();
    isOpen = false;
  }
</script>

{#snippet drawerFooter()}
  <div class="flex gap-3">
    <Button variant="simple" class="flex-1 font-bold" onclick={() => (isOpen = false)}>Batal</Button>
    <Button variant="primary" class="flex-1 font-bold" onclick={handleApply}>Terapkan Filter</Button>
  </div>
{/snippet}

<Drawer bind:isOpen {title} {subtitle} {icon} maxWidth="sm" footer={drawerFooter}>
  <div class="flex h-full flex-col">
    <div class="flex-1 space-y-6 px-5 py-6 lg:px-7 lg:py-8">
      {@render children()}
    </div>
  </div>
</Drawer>
