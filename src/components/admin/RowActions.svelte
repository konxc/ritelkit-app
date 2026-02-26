<script lang="ts">
  import ActionGroup from "./ActionGroup.svelte";

  let {
    detailHref,
    detailLabel = "Detail",
    viewHref,
    viewLabel = "Lihat",
    showEdit = false,
    showSend = false,
    showSave = true,
    showDelete = true,
    isSaving = false,
    isDeleting = false,
    isSending = false,
    onSave,
    onDelete,
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
    onDelete?: (
      event: MouseEvent & { currentTarget: HTMLButtonElement },
    ) => void;
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
    <button class="btn-ghost" data-action="edit">Edit</button>
  {/if}
  {#if showSend}
    <button
      class="btn-ghost flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
      data-action="send"
      disabled={isSending}
    >
      {#if isSending}
        <svg
          class="animate-spin h-3.5 w-3.5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          ><circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle><path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path></svg
        >
      {/if}
      Send
    </button>
  {/if}
  {#if showSave}
    <button
      class="btn-ghost flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
      data-action="save"
      disabled={isSaving}
      onclick={onSave}
    >
      {#if isSaving}
        <svg
          class="animate-spin h-3.5 w-3.5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          ><circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle><path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path></svg
        >
      {/if}
      Simpan
    </button>
  {/if}
  {#if showDelete}
    <button
      class="btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
      data-action="delete"
      disabled={isDeleting}
      onclick={onDelete}
    >
      {#if isDeleting}
        <svg
          class="animate-spin h-3.5 w-3.5 text-red-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          ><circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle><path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path></svg
        >
      {/if}
      Hapus
    </button>
  {/if}
</ActionGroup>
