<script module lang="ts">
  export type AdRow = {
    id: string | number;
    name: string;
    channel: string;
    budget: number;
    spend: number;
    status: string;
  };

  export type AdStatus = "draft" | "active" | "paused" | "completed";

  export type AdMutationInput = {
    name: string;
    channel: string;
    budget: number;
    spend: number;
    status: AdStatus;
    startAt?: string | null;
    endAt?: string | null;
    notes?: string | null;
  };
</script>

<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { fade, fly } from "svelte/transition";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { onMount, untrack } from "svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import Drawer from "../ui/overlay/Drawer.svelte";
  import Fab from "../ui/Fab.svelte";
  import InlineEditableField from "../ui/forms/InlineEditableField.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import ColumnVisibilityToggle from "../ui/ColumnVisibilityToggle.svelte";

  let {
    rows: initialRows = [],
    total: initialTotal = 0,
    q = "",
    status = "",
    page = 1,
    limit = 20,
    lang,
  }: {
    rows: AdRow[];
    total?: number;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();

  initI18n(untrack(() => lang));

  let toastRef = $state<ToastNotification>();
  let isSubmitting = $state(false);
  let isDrawerOpen = $state(false);
  let savingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);

  const queryClient = useQueryClient();

  let columns = $state([
    { id: "name", label: t("common.name"), isVisible: true, class: "font-bold text-stone-900" },
    { id: "channel", label: t("ads.channel"), isVisible: true, class: "text-[0.65rem] font-medium tracking-widest text-stone-500 uppercase" },
    { id: "budget", label: t("ads.budget"), isVisible: true, class: "w-32 text-center font-bold text-stone-800 tabular-nums" },
    { id: "spend", label: t("ads.spend"), isVisible: true, class: "w-32 text-center font-bold text-rose-600 tabular-nums" },
    { id: "status", label: t("common.status"), isVisible: true, class: "" },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);

  let localQ = $state(untrack(() => q));
  let localStatus = $state(untrack(() => status));
  let localPage = $state(untrack(() => page));

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

  const adsQuery = createQuery(() => ({
    queryKey: ["ads.list", { q: localQ, status: localStatus, limit, offset: (localPage - 1) * limit }],
    queryFn: () => trpc.ads.list.query({ q: localQ, status: localStatus, limit, offset: (localPage - 1) * limit }),
    initialData:
      localQ === "" && localStatus === "" && localPage === 1
        ? { data: initialRows, total: initialTotal }
        : undefined,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  }));

  let rows = $derived(adsQuery.data?.data || initialRows || []);
  let totalCount = $derived(adsQuery.data?.total || initialTotal || 0);

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const data: AdMutationInput = {
      name: formData.get("name") as string,
      channel: formData.get("channel") as string,
      budget: Number(formData.get("budget")),
      spend: 0,
      status: (formData.get("status") || "draft") as AdStatus,
      startAt: (formData.get("start_at") as string) || null,
      endAt: (formData.get("end_at") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    isSubmitting = true;
    try {
      await trpc.ads.create.mutate(data);
      toastRef?.show(t("ads.toast_create"), "success");
      form.reset();
      isDrawerOpen = false;
      queryClient.invalidateQueries({ queryKey: ["ads.list"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("common.error_occurred");
      toastRef?.show(message, "error");
    } finally {
      isSubmitting = false;
    }
  };

  const handleRowAction = async (id: string | number, action: string, rowElement: HTMLElement | null) => {
    const resolvedId = String(id);
    if (action === "delete") {
      if (confirm(t("ads.confirm_delete"))) {
        deletingId = resolvedId;
        try {
          await trpc.ads.delete.mutate(resolvedId);
          toastRef?.show(t("ads.toast_delete"), "success");
          queryClient.invalidateQueries({ queryKey: ["ads.list"] });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : t("common.error_occurred");
          toastRef?.show(message, "error");
        } finally {
          deletingId = null;
        }
      }
    } else if (action === "save" && rowElement) {
      const fields: Record<string, string> = {};
      rowElement.querySelectorAll("[data-field]").forEach((el) => {
        const field = el.getAttribute("data-field")!;
        if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
          fields[field] = el.value;
        } else {
          fields[field] = el.textContent?.trim() || "";
        }
      });

      const data: AdMutationInput = {
        name: fields.name,
        channel: fields.channel,
        budget: Number(fields.budget) || 0,
        spend: Number(fields.spend) || 0,
        status: (fields.status || "draft") as AdStatus,
      };

      savingId = resolvedId;
      try {
        await trpc.ads.update.mutate({ id: resolvedId, data });
        toastRef?.show(t("ads.toast_update"), "success");
        queryClient.invalidateQueries({ queryKey: ["ads.list"] });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : t("common.error_occurred");
        toastRef?.show(message, "error");
      } finally {
        savingId = null;
      }
    }
  };

</script>

{#snippet adIcon()}
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
    ><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/><path d="M9 18h6"/><path d="M9 14h6"/><path d="M12 12V9"/></svg>
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
      form="ads-form"
      variant="primary"
      class="relative flex h-11 flex-[2] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#c48a3a] px-8 py-0 font-black text-white shadow-[0_10px_30px_-10px_rgba(196,138,58,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_35px_-10px_rgba(196,138,58,0.6)] active:scale-[0.98] lg:h-[52px]"
      disabled={isSubmitting}
    >
      {#if isSubmitting}
        <div class="flex items-center gap-3">
          <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-xs">{t("common.saving")}</span>
        </div>
      {:else}
        <div class="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
            ><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          <span class="text-[0.75rem] tracking-tight uppercase">{t("ads.launch_campaign")}</span>
        </div>
      {/if}
    </Button>
  </div>
{/snippet}

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("ads.title_list")} muted={t("ads.badge_ads")} />
      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <div class="mr-2">
          <AdminHeaderFilters tab="ads" q={localQ} status={localStatus} {columns} />
        </div>

        <ColumnVisibilityToggle bind:columns />

        <div class="h-10 w-px bg-stone-200/80"></div>

        <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex items-center gap-2">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              ><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            {t("ads.launch_campaign")}
          </div>
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("ads.launch_campaign")} />

    <Drawer
      bind:isOpen={isDrawerOpen}
      title={t("ads.title_create")}
      subtitle={t("ads.badge_ads")}
      icon={adIcon}
      footer={drawerFooter}
      maxWidth="lg"
    >
      <div class="flex h-full flex-col px-5 py-6 lg:px-7 lg:py-8">
        <CrudInlineForm id="ads-form" onsubmit={handleCreate} {isSubmitting}>
          <div class="space-y-8">
            <div class="space-y-6">
              <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
                {t("ads.campaign_info")}
              </h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2 space-y-1.5">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    <label for="name" class="text-[0.8rem] font-bold text-stone-600">{t("ads.campaign_name")}</label>
                  </div>
                  <TextInput id="name" name="name" required placeholder={t("ads.name_placeholder")} class="font-bold ring-stone-100/50" />
                </div>
                <div class="space-y-1.5 text-left">
                   <div class="mb-1 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                     <label for="channel" class="text-[0.8rem] font-bold text-stone-600">{t("ads.channel")}</label>
                  </div>
                  <TextInput id="channel" name="channel" required placeholder={t("ads.channel_placeholder")} class="ring-stone-100/50" />
                </div>
                <div class="space-y-1.5 text-left">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <label for="budget" class="text-[0.8rem] font-bold text-stone-600">{t("ads.budget")}</label>
                  </div>
                  <TextInput id="budget" name="budget" type="number" required placeholder="0" class="font-bold tabular-nums ring-stone-100/50" />
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
                {t("ads.scheduling")}
              </h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5 text-left">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    <label for="start_at" class="text-[0.8rem] font-bold text-stone-600">{t("ads.start_date")}</label>
                  </div>
                  <TextInput id="start_at" name="start_at" type="date" class="ring-stone-100/50" />
                </div>
                <div class="space-y-1.5 text-left">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    <label for="end_at" class="text-[0.8rem] font-bold text-stone-600">{t("ads.end_date")}</label>
                  </div>
                  <TextInput id="end_at" name="end_at" type="date" class="ring-stone-100/50" />
                </div>
                <div class="col-span-2 space-y-1.5 text-left">
                   <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <label for="notes" class="text-[0.8rem] font-bold text-stone-600">{t("ads.notes")}</label>
                  </div>
                  <TextInput id="notes" name="notes" placeholder={t("ads.notes_placeholder")} class="ring-stone-100/50" />
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-[#c48a3a]/10 bg-[#c48a3a]/5 p-5 text-[#865d25]">
              <div class="flex gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mt-1 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <div>
                  <h4 class="text-[0.75rem] font-black tracking-wider uppercase">{t("catalog.categories.tips_title")}</h4>
                  <p class="mt-1 text-[0.8rem] leading-relaxed font-medium">
                    {t("ads.tips_campaign_launch") || "Pastikan budget iklan sesuai dengan target audience dan durasi kampanye yang direncanakan."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CrudInlineForm>
      </div>
    </Drawer>

    <Table headers={activeHeaders}>
      {#if rows.length === 0}
         <TableEmptyState
          title={t("ads.empty_title")}
          subtitle={t("ads.empty_description")}
          colspan={activeHeaders.length}
        />
      {/if}

      {#each rows as row (row.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          {#if columns[0].isVisible}
          <TableCell class="py-4">
            <InlineEditableField
              value={row.name}
              field="name"
              ariaLabel={t("common.name")}
              class="font-bold text-stone-900"
            />
          </TableCell>
          {/if}
          {#if columns[1].isVisible}
          <TableCell class="py-4">
            <InlineEditableField
              value={row.channel}
              field="channel"
              ariaLabel={t("ads.channel")}
              class="text-[0.65rem] font-medium tracking-widest text-stone-500 uppercase"
            />
          </TableCell>
          {/if}
          {#if columns[2].isVisible}
          <TableCell class="py-4">
            <InlineEditableField
              value={row.budget}
              field="budget"
              type="number"
              ariaLabel={t("ads.budget")}
              class="w-32 text-center font-bold text-stone-800 tabular-nums"
            />
          </TableCell>
          {/if}
          {#if columns[3].isVisible}
          <TableCell class="py-4">
             <InlineEditableField
              value={row.spend}
              field="spend"
              type="number"
              ariaLabel={t("ads.spend")}
              class="w-32 text-center font-bold text-rose-600 tabular-nums"
            />
          </TableCell>
          {/if}
          {#if columns[4].isVisible}
          <TableCell class="py-4">
            <select
              data-field="status"
              class="cursor-pointer rounded-lg border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 text-[0.7rem] font-bold tracking-wider text-stone-700 uppercase transition-all outline-none hover:border-[#c48a3a]/30 hover:bg-white focus:bg-white"
            >
              <option value="draft" selected={row.status === "draft"}>{t("ads.status_draft")}</option>
              <option value="active" selected={row.status === "active"}>🟢 {t("ads.status_active")}</option>
              <option value="paused" selected={row.status === "paused"}>🟡 {t("ads.status_paused")}</option>
              <option value="completed" selected={row.status === "completed"}>⚪ {t("ads.status_completed")}</option>
            </select>
          </TableCell>
          {/if}
          <TableCell class="py-4 pr-4 text-right">
            <RowActions
              isSaving={savingId === String(row.id)}
              isDeleting={deletingId === String(row.id)}
              onSave={(e) => handleRowAction(row.id, "save", (e as any).currentTarget.closest("tr"))}
              onDelete={() => handleRowAction(row.id, "delete", null)}
            />
          </TableCell>
        </TableRow>
      {/each}
    </Table>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
