<script module lang="ts">
  export type CmsPageRow = {
    id: string;
    slug: string;
    title: string;
    contentMd?: string;
    isActive?: number;
    updatedAt?: string | Date;
  };
</script>

<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import SectionHeader from "../SectionHeader.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import ActionGroup from "../ActionGroup.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import Textarea from "../ui/forms/Textarea.svelte";
  import { actions } from "astro:actions";

  let {
    rows: initialRows = [],
    q = "",
    page = 1,
    limit = 30,
  }: {
    rows?: CmsPageRow[];
    q?: string;
    page?: number;
    limit?: number;
  } = $props();

  const offset = $derived((page - 1) * limit);

  let pageId = $state("");
  let title = $state("");
  let slug = $state("");
  let contentMd = $state("");
  let isActive = $state("true");

  let isSubmitting = $state(false);
  let rows = $state<CmsPageRow[]>([]);
  let rowStates = $state<Record<string, { isSaving?: boolean; isDeleting?: boolean; isEditing?: boolean }>>({});
  let toastRef = $state<ToastNotification>();

  const refreshData = async () => {
    const { data, error } = await actions.listCmsPages({ q, limit, offset });
    if (!error && data) {
      rows = data.rows as CmsPageRow[];
    }
  };

  // Sync with initialRows from SSR
  $effect(() => {
    rows = initialRows;
  });

  // Re-fetch when props change (search/pagination)
  $effect(() => {
    refreshData();
  });

  const resetForm = () => {
    pageId = "";
    title = "";
    slug = "";
    contentMd = "";
    isActive = "true";
  };

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    isSubmitting = true;
    const payload = {
      title,
      slug,
      contentMd,
      isActive: isActive === "true",
    };

    const { error } = pageId
      ? await actions.updateCmsPage({ id: pageId, data: payload })
      : await actions.createCmsPage(payload);

    isSubmitting = false;

    if (error) {
      toastRef?.show(error.message, "error");
    } else {
      toastRef?.show(pageId ? "Halaman diperbarui!" : "Halaman dibuat!", "success");
      resetForm();
      await refreshData();
    }
  };

  const handleClear = () => resetForm();

  const handleEdit = async (id: string) => {
    rowStates[id] = { ...rowStates[id], isEditing: true };

    const { data, error } = await actions.getCmsPage(id);
    if (!error && data) {
      pageId = id;
      title = data.title || "";
      slug = data.slug || "";
      contentMd = data.contentMd || "";
      isActive = data.isActive === 1 ? "true" : "false";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (error) {
      toastRef?.show(error.message, "error");
    }

    rowStates[id] = { ...rowStates[id], isEditing: false };
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus halaman ini?")) return;

    rowStates[id] = { ...rowStates[id], isDeleting: true };
    const { error } = await actions.deleteCmsPage(id);

    if (error) {
      toastRef?.show(error.message, "error");
    } else {
      toastRef?.show("Halaman dihapus", "success");
      await refreshData();
    }
    rowStates[id] = { ...rowStates[id], isDeleting: false };
  };
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <SectionHeader title="Buat Halaman" badge="Brand Awareness" />
    <CrudInlineForm id="cms-form" onsubmit={handleSubmit} {isSubmitting}>
      <input type="hidden" name="page_id" value={pageId} />
      <div class="space-y-4 border-b border-stone-100 pb-5">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="md:col-span-1">
            <TextInput id="title" name="title" label="Judul" bind:value={title} required />
          </div>
          <div class="md:col-span-1">
            <TextInput
              id="slug"
              name="slug"
              label="Slug"
              placeholder="contoh: semesta-bersholawat"
              bind:value={slug}
              required
            />
          </div>
          <div class="md:col-span-1">
            <SelectInput
              id="is_active"
              name="is_active"
              label="Status"
              bind:value={isActive}
              options={[
                { value: "true", label: "Aktif" },
                { value: "false", label: "Draft" },
              ]}
            />
          </div>
        </div>
        <div>
          <Textarea
            id="content_md"
            name="content_md"
            label="Konten (Markdown)"
            rows={8}
            bind:value={contentMd}
            required
            class="min-h-[200px] font-mono"
          />
        </div>
      </div>
      <div class="mt-4 flex gap-3">
        <ActionGroup>
          <Button type="submit" variant="primary" class="h-[38px] w-full px-8 sm:w-auto" disabled={isSubmitting}>
            {#if isSubmitting}
              <svg
                class="mr-2 -ml-1 inline-block h-3.5 w-3.5 animate-spin text-white"
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
            Simpan
          </Button>
          <Button type="button" variant="secondary" class="h-[38px] px-6" onclick={handleClear}>Clear</Button>
        </ActionGroup>
      </div>
    </CrudInlineForm>

    <div class="mt-6">
      <Table headers={["Judul", "Slug", "Status", "Update", "Aksi"]}>
        {#each rows as p (p.id)}
          <TableRow data-id={p.id}>
            <TableCell data-field="title" class="px-4 py-3">{p.title}</TableCell>
            <TableCell data-field="slug" class="px-4 py-3 font-mono text-xs text-stone-500">{p.slug}</TableCell>
            <TableCell data-field="isActive" class="px-4 py-3">
              <span
                class={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${p.isActive === 1 ? "border border-emerald-100 bg-emerald-50 text-emerald-600" : "border border-stone-200 bg-stone-100 text-stone-500"}`}
              >
                {p.isActive === 1 ? "Aktif" : "Draft"}
              </span>
            </TableCell>
            <TableCell class="px-4 py-3 text-xs text-stone-500 tabular-nums"
              >{String(p.updatedAt ?? "").split("T")[0]}</TableCell
            >
            <TableCell class="px-4 py-3">
              <RowActions
                viewHref={`/content/${p.slug}`}
                showEdit={true}
                onEdit={() => handleEdit(p.id)}
                onDelete={() => handleDelete(p.id)}
                isDeleting={rowStates[p.id]?.isDeleting}
                isSaving={rowStates[p.id]?.isEditing}
              />
            </TableCell>
          </TableRow>
        {/each}
      </Table>
    </div>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
