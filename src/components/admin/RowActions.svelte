<script lang="ts">
  import ActionGroup from "./ActionGroup.svelte";
  import { t } from "../../lib/i18n/store.svelte";
  import type { Snippet } from "svelte";

  let {
    detailHref,
    detailLabel = t("common.detail"),
    viewHref,
    viewLabel = t("common.view"),
    showEdit = false,
    showSend = false,
    showSave = true,
    showDelete = true,
    isSaving = false,
    isDeleting = false,
    isSending = false,
    onSave,
    onDelete,
    onSend,
    onEdit,
    children,
  }: {
    detailHref?: string;
    detailLabel?: string;
    viewHref?: string;
    viewLabel?: string;
    showEdit?: boolean;
    showSend?: boolean;
    showSave?: boolean;
    showDelete?: boolean;
    isSaving?: boolean;
    isDeleting?: boolean;
    isSending?: boolean;
    onSave?: (event: MouseEvent & { currentTarget: HTMLButtonElement }) => void;
    onDelete?: (event: MouseEvent & { currentTarget: HTMLButtonElement }) => void;
    onSend?: (event: MouseEvent & { currentTarget: HTMLButtonElement }) => void;
    onEdit?: (event: MouseEvent & { currentTarget: HTMLButtonElement }) => void;
    children?: Snippet;
  } = $props();
</script>

<ActionGroup>
  {#if detailHref}
    <a class="btn-ghost" href={detailHref}>{detailLabel}</a>
  {/if}
  {#if viewHref}
    <a class="btn-ghost" href={viewHref} target="_blank">{viewLabel}</a>
  {/if}
  {#if showEdit}
    <button class="btn-ghost" data-action="edit" onclick={onEdit}>{t("common.edit")}</button>
  {/if}
  {#if showSend}
    <button
      class="btn-ghost flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50"
      data-action="send"
      disabled={isSending}
      onclick={onSend}
    >
      {#if isSending}
        <svg class="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path></svg
        >
      {/if}
      {t("common.send")}
    </button>
  {/if}

  {#if children}
    {@render children()}
  {/if}

  {#if showSave}
    <button
      class="btn-ghost flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50"
      data-action="save"
      disabled={isSaving}
      onclick={onSave}
    >
      {#if isSaving}
        <svg class="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path></svg
        >
      {/if}
      {t("common.save")}
    </button>
  {/if}
  {#if showDelete}
    <button
      class="btn-ghost flex items-center gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      data-action="delete"
      disabled={isDeleting}
      onclick={onDelete}
    >
      {#if isDeleting}
        <svg
          class="h-3.5 w-3.5 animate-spin text-red-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path></svg
        >
      {/if}
      {t("common.delete")}
    </button>
  {/if}
</ActionGroup>
