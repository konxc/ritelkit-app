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
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import Textarea from "../ui/forms/Textarea.svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import { onMount, untrack } from "svelte";
  import { actions } from "astro:actions";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import ColumnVisibilityToggle from "../ui/ColumnVisibilityToggle.svelte";
  import Fab from "../ui/Fab.svelte";
  import Drawer from "../ui/overlay/Drawer.svelte";

  let {
    rows: initialRows = [],
    q = "",
    status = "",
    page = 1,
    limit = 30,
    lang,
  }: {
    rows?: CmsPageRow[];
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();

  initI18n(untrack(() => lang));

  let columns = $state([
    { id: "title", label: t("cms.label_title"), isVisible: true },
    { id: "slug", label: t("cms.label_slug"), isVisible: true },
    { id: "status", label: t("cms.label_status"), isVisible: true },
    { id: "updatedAt", label: t("cms.label_updated_at"), isVisible: true },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);

  let localQ = $state(untrack(() => q));
  let localStatus = $state(untrack(() => status));
  let localPage = $state(untrack(() => page));
  const localLimit = untrack(() => limit) || 20;

  let rows = $state<CmsPageRow[]>([]);
  let rowStates = $state<Record<string, { isSaving?: boolean; isDeleting?: boolean; isEditing?: boolean }>>({});
  let toastRef = $state<ToastNotification>();
  let isDrawerOpen = $state(false);
  let isSubmitting = $state(false);

  let pageId = $state("");
  let title = $state("");
  let slug = $state("");
  let contentMd = $state("");
  let isActive = $state("true");

  // Sync with initialRows from SSR
  $effect(() => {
    rows = initialRows;
  });

  const refreshData = async () => {
    const offset = (localPage - 1) * localLimit;
    const { data, error } = await actions.listCmsPages({ q: localQ, status: localStatus, limit: localLimit, offset });
    if (!error && data) {
      rows = data.rows as CmsPageRow[];
    }
  };

  function syncFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    localQ = params.get("q") || "";
    localStatus = params.get("status") || "";
    localPage = parseInt(params.get("page") || "1", 10);
  }

  onMount(() => {
    syncFiltersFromUrl();
    window.addEventListener("popstate", syncFiltersFromUrl);
    window.addEventListener("astro:after-navigation", syncFiltersFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFiltersFromUrl);
      window.removeEventListener("astro:after-navigation", syncFiltersFromUrl);
    };
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
      toastRef?.show(pageId ? t("cms.toast_update") : t("cms.toast_create"), "success");
      resetForm();
      isDrawerOpen = false;
      await refreshData();
    }
  };

  const handleEdit = async (id: string) => {
    rowStates[id] = { ...rowStates[id], isEditing: true };

    const { data, error } = await actions.getCmsPage(id);
    if (!error && data) {
      pageId = id;
      title = data.title || "";
      slug = data.slug || "";
      contentMd = data.contentMd || "";
      isActive = data.isActive === 1 ? "true" : "false";
      isDrawerOpen = true;
    } else if (error) {
      toastRef?.show(error.message, "error");
    }

    rowStates[id] = { ...rowStates[id], isEditing: false };
  };

  const handleRowAction = async (id: string, action: string) => {
    if (action === "delete") {
      if (!confirm(t("cms.confirm_delete"))) return;
      rowStates[id] = { ...rowStates[id], isDeleting: true };
      const { error } = await actions.deleteCmsPage(id);
      rowStates[id] = { ...rowStates[id], isDeleting: false };

      if (error) {
        toastRef?.show(error.message, "error");
      } else {
        toastRef?.show(t("cms.toast_delete"), "success");
        refreshData();
      }
      return;
    }
  };
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("cms.title_list")} muted={t("cms.subtitle_list")} />
      
      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <div class="mr-2">
          <AdminHeaderFilters tab="content" q={localQ} status={localStatus} {columns} {lang} />
        </div>

        <ColumnVisibilityToggle bind:columns />

        <div class="h-10 w-px bg-stone-200/80"></div>

        <Button variant="primary" onclick={() => { resetForm(); isDrawerOpen = true; }} class="group flex items-center gap-2">
          <div class="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            {t("cms.title_create")}
          </div>
        </Button>
      </div>
    </div>

    <Fab onclick={() => { resetForm(); isDrawerOpen = true; }} label={t("cms.title_create")} />

    {#snippet cmsIcon()}
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
        ><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
    {/snippet}

    {#snippet drawerFooter()}
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="h-11 flex-1 rounded-2xl border border-stone-200 bg-white text-[0.7rem] font-black tracking-widest text-stone-400 uppercase transition-all hover:bg-stone-50 hover:text-stone-600 focus:outline-none active:scale-95 lg:h-[52px]"
          onclick={() => (isDrawerOpen = false)}
        >
          {t("common.cancel")}
        </button>
        <Button
          type="submit"
          form="cms-form"
          variant="primary"
          class="relative flex h-11 flex-[2] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#c48a3a] px-8 py-0 font-black text-white shadow-[0_10px_30px_-10px_rgba(196,138,58,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_35px_-10px_rgba(196,138,58,0.6)] active:scale-[0.98] lg:h-[52px]"
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
              <span class="text-xs">{t("common.saving")}</span>
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
                stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
              <span class="text-[0.75rem] tracking-tight uppercase">{t("cms.button_save")}</span>
            </div>
          {/if}
        </Button>
      </div>
    {/snippet}

    <Drawer
      bind:isOpen={isDrawerOpen}
      title={pageId ? t("cms.title_edit") : t("cms.title_create")}
      subtitle={t("cms.badge_brand_awareness")}
      icon={cmsIcon}
      footer={drawerFooter}
      maxWidth="md"
    >
      <div class="px-5 py-6 lg:px-7 lg:py-8">
        <CrudInlineForm id="cms-form" onsubmit={handleSubmit} {isSubmitting}>
          <div class="space-y-6">
            <TextInput id="title" name="title" label={t("cms.label_title")} bind:value={title} required />
            <TextInput
              id="slug"
              name="slug"
              label={t("cms.label_slug")}
              placeholder={t("cms.placeholder_slug")}
              bind:value={slug}
              required
            />
            <SelectInput
              id="is_active"
              name="is_active"
              label={t("cms.label_status")}
              bind:value={isActive}
              options={[
                { value: "true", label: t("common.active_status") },
                { value: "false", label: t("common.draft_status") },
              ]}
            />
            <Textarea
              id="content_md"
              name="content_md"
              label={t("cms.label_content_markdown")}
              rows={12}
              bind:value={contentMd}
              required
              class="min-h-[300px] font-mono"
            />
          </div>
        </CrudInlineForm>
      </div>
    </Drawer>

    <div class="mt-2">
      <Table headers={activeHeaders}>
        {#if rows.length === 0}
          <TableEmptyState
            title={t("cms.empty_title")}
            subtitle={t("cms.empty_description")}
            colspan={activeHeaders.length}
          />
        {/if}
        {#each rows as p (p.id)}
          <TableRow data-id={p.id} class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
            {#if columns[0].isVisible}
              <TableCell class="py-4 font-bold text-stone-900">{p.title}</TableCell>
            {/if}
            {#if columns[1].isVisible}
              <TableCell class="py-4 font-mono text-xs text-stone-500">{p.slug}</TableCell>
            {/if}
            {#if columns[2].isVisible}
              <TableCell class="py-4">
                <span
                  class={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${p.isActive === 1 ? "border border-emerald-100 bg-emerald-50 text-emerald-600" : "border border-stone-200 bg-stone-100 text-stone-500"}`}
                >
                  {p.isActive === 1 ? t("common.active_status") : t("common.draft_status")}
                </span>
              </TableCell>
            {/if}
            {#if columns[3].isVisible}
              <TableCell class="py-4 text-xs text-stone-500 tabular-nums">
                {String(p.updatedAt ?? "").split("T")[0]}
              </TableCell>
            {/if}
            <TableCell align="center" class="py-4">
              <RowActions
                viewHref={`/content/${p.slug}`}
                showEdit={true}
                onEdit={() => handleEdit(p.id)}
                onDelete={() => handleRowAction(p.id, "delete")}
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
