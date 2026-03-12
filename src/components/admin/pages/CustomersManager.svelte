<script module lang="ts">
  export type CustomerRow = {
    id: string | number;
    name: string;
    phone: string;
    email?: string | null;
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
  import SectionHeader from "../SectionHeader.svelte";
  import RowActions from "../RowActions.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import Drawer from "../ui/overlay/Drawer.svelte";
  import Fab from "../ui/Fab.svelte";
  import InlineEditableField from "../ui/forms/InlineEditableField.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";

  type CustomerMutationInput = {
    name: string;
    phone: string;
    email?: string | null;
    notes?: string | null;
  };

  let {
    initialRows = [],
    total: initialTotal = 0,
    q = "",
    status = "",
    page = 1,
    limit = 20,
    lang,
  }: {
    initialRows?: CustomerRow[];
    total?: number;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();

  initI18n(untrack(() => lang));

  const queryClient = useQueryClient();
  let toastRef = $state<ToastNotification>();
  let isSubmitting = $state(false);
  let localQ = $state(untrack(() => q));
  let localStatus = $state(untrack(() => status));
  let localPage = $state(untrack(() => page));
  let localLimit = $derived(limit);
  let isDrawerOpen = $state(false);
  let savingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);

  let columns = $state([
    { id: "name", label: t("common.name"), isVisible: true, class: "font-bold text-stone-900" },
    { id: "phone", label: t("customers.phone"), isVisible: true, class: "font-mono font-bold text-[#c48a3a]" },
    { id: "email", label: t("common.email"), isVisible: true, class: "text-stone-600" },
    { id: "notes", label: t("customers.notes"), isVisible: true, class: "text-sm text-stone-500 italic" },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);

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

  const customersQuery = createQuery(() => ({
    queryKey: ["customers.list", { q: localQ, limit, offset: (localPage - 1) * limit }],
    queryFn: () => trpc.customers.list.query({ q: localQ, limit, offset: (localPage - 1) * limit }),
    initialData:
      localQ === "" && localPage === 1 ? { data: initialRows, total: initialTotal } : undefined,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  }));

  let rows = $derived(customersQuery.data?.data || initialRows || []);
  let total = $derived(customersQuery.data?.total || initialTotal || 0);
  let isFetching = $derived(customersQuery.isFetching);

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const data: CustomerMutationInput = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: (formData.get("email") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    isSubmitting = true;
    try {
      await trpc.customers.create.mutate(data);
      toastRef?.show(t("customers.toast_add"), "success");
      form.reset();
      isDrawerOpen = false;
      queryClient.invalidateQueries({ queryKey: ["customers.list"] });
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
      if (confirm(t("customers.confirm_delete"))) {
        deletingId = resolvedId;
        try {
          await trpc.customers.delete.mutate(resolvedId);
          toastRef?.show(t("customers.toast_delete"), "success");
          queryClient.invalidateQueries({ queryKey: ["customers.list"] });
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
        if (el instanceof HTMLInputElement) {
          fields[field] = el.value;
        } else {
          fields[field] = el.textContent?.trim() || "";
        }
      });

      const data: CustomerMutationInput = {
        name: fields.name,
        phone: fields.phone,
        email: fields.email || null,
        notes: fields.notes || null,
      };

      savingId = resolvedId;
      try {
        await trpc.customers.update.mutate({ id: resolvedId, data });
        toastRef?.show(t("customers.toast_update"), "success");
        queryClient.invalidateQueries({ queryKey: ["customers.list"] });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : t("common.error_occurred");
        toastRef?.show(message, "error");
      } finally {
        savingId = null;
      }
    }
  };

  const syncFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    q = params.get("q") || "";
    page = Number(params.get("page")) || 1;
  };

  onMount(() => {
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  });
</script>

{#snippet customerIcon()}
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
    ><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
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
      form="customer-form"
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
            ><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          <span class="text-[0.75rem] tracking-tight uppercase">{t("customers.add_data")}</span>
        </div>
      {/if}
    </Button>
  </div>
{/snippet}

<div class="h-full w-full text-xs">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("customers.title_list")} muted={t("customers.badge_crm")} />
      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="customers" q={localQ} bind:columns {lang} />

        <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex items-center gap-2">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              ><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
            {t("customers.add_data")}
          </div>
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("customers.add_data")} />

    <Drawer
      bind:isOpen={isDrawerOpen}
      title={t("customers.title_add")}
      subtitle={t("customers.badge_crm")}
      icon={customerIcon}
      footer={drawerFooter}
      maxWidth="lg"
    >
      <div class="flex h-full flex-col px-5 py-6 lg:px-7 lg:py-8">
        <CrudInlineForm id="customer-form" onsubmit={handleCreate} isSubmitting={isSubmitting}>
          <div class="space-y-8">
            <div class="space-y-6">
              <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
                {t("customers.basic_info")}
              </h4>
              <div class="grid grid-cols-1 gap-6">
                <div class="space-y-1.5">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <label for="name" class="text-[0.8rem] font-bold text-stone-600">{t("customers.full_name")}</label>
                  </div>
                  <TextInput id="name" name="name" required placeholder={t("customers.name_placeholder")} class="font-bold ring-stone-100/50" />
                </div>

                <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div class="space-y-1.5">
                    <div class="mb-1 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <label for="phone" class="text-[0.8rem] font-bold text-stone-600">{t("customers.phone")}</label>
                    </div>
                    <TextInput id="phone" name="phone" required placeholder={t("customers.phone_placeholder")} class="font-mono ring-stone-100/50" />
                  </div>
                  <div class="space-y-1.5">
                    <div class="mb-1 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      <label for="email" class="text-[0.8rem] font-bold text-stone-600">{t("customers.email_optional")}</label>
                    </div>
                    <TextInput id="email" name="email" type="email" placeholder={t("customers.email_placeholder")} class="ring-stone-100/50" />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
                    <label for="notes" class="text-[0.8rem] font-bold text-stone-600">{t("customers.notes")}</label>
                  </div>
                  <TextInput id="notes" name="notes" placeholder={t("customers.notes_placeholder")} class="ring-stone-100/50" />
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-[#c48a3a]/10 bg-[#c48a3a]/5 p-5 text-[#865d25]">
              <div class="flex gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mt-1 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <div>
                  <h4 class="text-[0.75rem] font-black tracking-wider uppercase">{t("catalog.categories.tips_title")}</h4>
                  <p class="mt-1 text-[0.8rem] leading-relaxed font-medium">
                    {t("customers.tips_crm")}
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
          title={t("customers.empty")}
          subtitle={t("customers.empty_description")}
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
              ariaLabel={t("customers.full_name")}
              class="font-bold text-stone-900"
            />
          </TableCell>
          {/if}

          {#if columns[1].isVisible}
          <TableCell class="py-4">
             <InlineEditableField
              value={row.phone}
              field="phone"
              ariaLabel={t("customers.phone")}
              class="font-mono font-bold text-[#c48a3a]"
            />
          </TableCell>
          {/if}

          {#if columns[2].isVisible}
          <TableCell class="py-4">
             <InlineEditableField
              value={row.email || "-"}
              field="email"
              ariaLabel={t("common.email")}
              class="text-stone-600"
            />
          </TableCell>
          {/if}

          {#if columns[3].isVisible}
          <TableCell class="py-4">
             <InlineEditableField
              value={row.notes || "-"}
              field="notes"
              ariaLabel={t("customers.notes")}
              class="text-sm text-stone-500 italic"
            />
          </TableCell>
          {/if}

          <TableCell class="py-4 pr-4 text-right">
            <RowActions
              detailHref={`/admin/customers/${row.id}`}
              isSaving={savingId === row.id}
              isDeleting={deletingId === row.id}
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
