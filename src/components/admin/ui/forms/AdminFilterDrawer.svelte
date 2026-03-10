<script lang="ts">
  import Drawer from "../overlay/Drawer.svelte";
  import Button from "../Button.svelte";
  import type { Snippet } from "svelte";
  import { t } from "../../../../lib/i18n/store.svelte";

  let {
    isOpen = $bindable(false),
    title = t("common.filter_advanced"),
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
    <Button variant="simple" class="flex-1 font-bold" onclick={() => (isOpen = false)}>{t("common.cancel")}</Button>
    <Button variant="primary" class="flex-1 font-bold" onclick={handleApply}>{t("common.apply_filter")}</Button>
  </div>
{/snippet}

<Drawer bind:isOpen {title} {subtitle} {icon} maxWidth="sm" footer={drawerFooter}>
  <div class="flex h-full flex-col">
    <div class="flex-1 space-y-6 px-5 py-6 lg:px-7 lg:py-8">
      {@render children()}
    </div>
  </div>
</Drawer>
