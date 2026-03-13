<script lang="ts">
  import type { Snippet } from "svelte";
  import Drawer from "./Drawer.svelte";
  import CrudInlineForm from "../../CrudInlineForm.svelte";
  import Button from "../Button.svelte";
  import { t } from "../../../../lib/i18n/store.svelte";

  interface Props {
    isOpen: boolean;
    title: string;
    subtitle?: string;
    icon?: Snippet;
    isSubmitting?: boolean;
    onsubmit: (e: SubmitEvent) => void;
    children?: Snippet;
    maxWidth?: "md" | "lg" | "xl" | "2xl" | string;
    formId?: string;
    saveLabel?: string;
    cancelLabel?: string;
  }

  let {
    isOpen = $bindable(),
    title,
    subtitle,
    icon,
    isSubmitting = false,
    onsubmit,
    children,
    maxWidth = "md",
    formId = "drawer-form",
    saveLabel,
    cancelLabel,
  }: Props = $props();

  const resolvedSaveLabel = $derived(saveLabel || t("common.add") || "Save");
  const resolvedCancelLabel = $derived(cancelLabel || t("common.cancel") || "Cancel");
</script>

{#snippet footer()}
  <div class="flex items-center gap-3">
    <button
      type="button"
      class="flex h-11 flex-1 rounded-2xl border border-stone-200 bg-white text-[0.7rem] font-black tracking-widest text-stone-400 uppercase transition-all hover:bg-stone-50 hover:text-stone-600 focus:outline-none active:scale-95 lg:hidden lg:h-[52px]"
      onclick={() => (isOpen = false)}
    >
      {resolvedCancelLabel}
    </button>
    <Button
      type="submit"
      form={formId}
      variant="primary"
      class="relative flex h-11 flex-[2] items-center justify-center gap-3 overflow-hidden rounded-2xl px-8 py-0 font-black text-white transition-all active:scale-[0.98] lg:h-[52px]"
      disabled={isSubmitting}
    >
      {#if isSubmitting}
        <div class="flex items-center gap-3">
          <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span class="text-xs">{t("common.loading") || "Processing..."}</span>
        </div>
      {:else}
        <div class="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          <span class="text-[0.75rem] tracking-tight uppercase">{resolvedSaveLabel}</span>
        </div>
      {/if}
    </Button>
  </div>
{/snippet}

<Drawer bind:isOpen {title} {subtitle} {icon} {footer} {maxWidth}>
  <div class="flex h-full flex-col px-5 py-6 lg:px-7 lg:py-8">
    <CrudInlineForm id={formId} {onsubmit} {isSubmitting} className="flex h-full flex-col">
      <div class="flex flex-1 flex-col space-y-6 lg:space-y-8">
        {@render children?.()}
      </div>
    </CrudInlineForm>
  </div>
</Drawer>
