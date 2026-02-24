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
    }: {
      detailHref?: string;
      detailLabel?: string;
      viewHref?: string;
      viewLabel?: string;
      showEdit?: boolean;
      showSend?: boolean;
      showSave?: boolean;
      showDelete?: boolean;
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
    <button class="btn-ghost" data-action="send">Send</button>
  {/if}
  {#if showSave}
    <button class="btn-ghost" data-action="save">Simpan</button>
  {/if}
  {#if showDelete}
    <button class="btn-ghost" data-action="delete">Hapus</button>
  {/if}
</ActionGroup>
