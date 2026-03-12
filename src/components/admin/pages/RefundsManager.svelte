<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { onMount, untrack } from "svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import Drawer from "../ui/overlay/Drawer.svelte";
  import Fab from "../ui/Fab.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import InlineEditableField from "../ui/forms/InlineEditableField.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import Badge from "../ui/Badge.svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import ColumnVisibilityToggle from "../ui/ColumnVisibilityToggle.svelte";
  import { fade, fly } from "svelte/transition";

  export type RefundRow = {
    id: string | number;
    orderNo: string;
    amount: number;
    status: string;
    providerStatus?: string | null;
    providerResponseJson?: string | null;
    reason?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };

  let {
    rows: initialRows = [],
    total: initialTotal = 0,
    q = "",
    status = "",
    page = 1,
    limit = 20,
    lang,
  }: {
    rows?: RefundRow[];
    total?: number;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();

  initI18n(untrack(() => lang));

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

  const offset = $derived((page - 1) * limit);
  const queryClient = useQueryClient();

  let columns = $state([
    { id: "orderNo", label: t("orders.order_no"), isVisible: true, class: "font-mono font-medium text-stone-600" },
    {
      id: "amount",
      label: t("refunds.amount"),
      isVisible: true,
      class: "font-mono font-bold text-stone-800 tabular-nums",
    },
    { id: "status", label: t("common.status"), isVisible: true, class: "" },
    { id: "reason", label: t("refunds.reason"), isVisible: true, class: "text-sm text-stone-500 italic" },
    { id: "createdAt", label: t("common.date"), isVisible: true, class: "hidden lg:table-cell" },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);

  let toastRef = $state<ToastNotification>();
  let isSubmitting = $state(false);
  let isDrawerOpen = $state(false);

  const refundsQuery = createQuery(() => ({
    queryKey: ["refunds.list", { q: localQ, status: localStatus, limit, offset: (localPage - 1) * limit }],
    queryFn: () =>
      trpc.refunds.list.query({
        q: localQ,
        status: localStatus ? [localStatus] : undefined,
        limit,
        offset: (localPage - 1) * limit,
      }),
    initialData:
      localQ === "" && localStatus === "" && localPage === 1
        ? { rows: initialRows, total: initialTotal }
        : undefined,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  }));

  let currentRefunds = $derived((refundsQuery.data?.rows as RefundRow[]) || initialRows);
  let total = $derived(refundsQuery.data?.total || 0);
  let isFetching = $derived(refundsQuery.isFetching);

  let savingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);

  const ordersQuery = createQuery(() => ({
    queryKey: ["orders.list", { limit: 100 }],
    queryFn: () => trpc.orders.list.query({ limit: 100 }),
  }));

  let availableOrders = $derived(ordersQuery.data?.rows || []);

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    isSubmitting = true;
    try {
      const orderNo = formData.get("order_no") as string;
      const order = availableOrders.find((o: any) => o.orderNo === orderNo);

      if (!order) {
        toastRef?.show(t("refunds.invalid_order"), "error");
        return;
      }

      await trpc.refunds.create.mutate({
        orderNo: orderNo,
        orderId: order.id,
        amount: Number(formData.get("amount")),
        status: formData.get("status") as string,
        reason: (formData.get("reason") as string) || undefined,
      });

      toastRef?.show(t("refunds.toast_create"), "success");
      form.reset();
      isDrawerOpen = false;
      queryClient.invalidateQueries({ queryKey: ["refunds.list"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("common.error_occurred");
      toastRef?.show(message, "error");
    } finally {
      isSubmitting = false;
    }
  };

  const handleAction = async (id: string | number, action: string, rowEl: HTMLElement | null) => {
    const resolvedId = String(id);
    if (action === "delete") {
      if (!confirm(t("refunds.confirm_delete"))) return;
      deletingId = resolvedId;
      try {
        await trpc.refunds.delete.mutate(resolvedId);
        toastRef?.show(t("refunds.toast_delete"), "success");
        queryClient.invalidateQueries({ queryKey: ["refunds.list"] });
      } catch (error: any) {
        toastRef?.show(error.message, "error");
      } finally {
        deletingId = null;
      }
      return;
    }

    if (action === "save" && rowEl) {
      savingId = resolvedId;
      try {
        const payload: any = {};
        rowEl.querySelectorAll("[data-field]").forEach((cell) => {
          const field = cell.getAttribute("data-field");
          if (!field) return;
          if (cell instanceof HTMLSelectElement || cell instanceof HTMLInputElement) {
            payload[field] = cell.value;
          } else {
            payload[field] = (cell as HTMLElement).textContent?.trim();
          }
        });

        if (payload.amount) payload.amount = Number(payload.amount);

        await trpc.refunds.update.mutate({ id: resolvedId, data: payload });
        toastRef?.show(t("refunds.toast_update"), "success");
        queryClient.invalidateQueries({ queryKey: ["refunds.list"] });
      } catch (error: any) {
        toastRef?.show(error.message, "error");
      } finally {
        savingId = null;
      }
    }
  };
</script>

{#snippet refundIcon()}
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
    ><path d="M3 10h18" /><path d="M7 15h1v4" /><path d="M11 15h1v4" /><path d="M15 15h1v4" /><path
      d="M11 21v-1c0-3.87 3.13-7 7-7h3"
    /><path d="m3 7 4 3-4 3" /></svg
  >
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
      form="refund-form"
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
            stroke-linejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg
          >
          <span class="text-[0.75rem] tracking-tight uppercase">{t("refunds.create_refund")}</span>
        </div>
      {/if}
    </Button>
  </div>
{/snippet}

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
  <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
    <SectionHeader title={t("refunds.title_list")} muted={t("refunds.badge_manual")} />
    <div class="hidden lg:flex lg:items-center lg:gap-3">
        <div class="mr-2">
          <AdminHeaderFilters tab="refund" q={localQ} status={localStatus} {columns} {lang} />
        </div>

      <ColumnVisibilityToggle bind:columns />

      <div class="h-10 w-px bg-stone-200/80"></div>

      <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex items-center gap-2">
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
            stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
          >
          {t("refunds.create_refund")}
        </div>
      </Button>
    </div>
  </div>

  <Fab onclick={() => (isDrawerOpen = true)} label={t("refunds.create_refund")} />

  <Drawer
    bind:isOpen={isDrawerOpen}
    title={t("refunds.title_create")}
    subtitle={t("refunds.badge_manual")}
    icon={refundIcon}
    footer={drawerFooter}
    maxWidth="lg"
  >
    <div class="flex h-full flex-col px-5 py-6 lg:px-7 lg:py-8">
      <CrudInlineForm id="refund-form" onsubmit={handleCreate} {isSubmitting}>
        <div class="space-y-8">
          <div class="space-y-6">
            <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
              {t("refunds.basic_info")}
            </h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2 space-y-1.5">
                <div class="mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="8" x2="16" y1="10" y2="10"/><line x1="8" x2="16" y1="14" y2="14"/><line x1="8" x2="16" y1="18" y2="18"/></svg>
                  <label for="order_no" class="text-[0.8rem] font-bold text-stone-600">{t("refunds.order_no")}</label>
                </div>
                <TextInput
                  id="order_no"
                  name="order_no"
                  required
                  placeholder={t("refunds.order_no_placeholder")}
                  list="order-options"
                  class="w-full font-mono font-bold ring-stone-100/50"
                />
                <datalist id="order-options">
                  {#each availableOrders as order}
                    <option value={order.orderNo}>{order.customerName}</option>
                  {/each}
                </datalist>
              </div>
              <div class="space-y-1.5">
                <div class="mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <label for="amount" class="text-[0.8rem] font-bold text-stone-600">{t("refunds.amount")}</label>
                </div>
                <TextInput
                  id="amount"
                  name="amount"
                  type="number"
                  required
                  placeholder="0"
                  class="w-full font-mono tabular-nums ring-stone-100/50"
                />
              </div>
              <div class="space-y-1.5">
                <div class="mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                  <label for="status" class="text-[0.8rem] font-bold text-stone-600">{t("common.status")}</label>
                </div>
                <SelectInput
                  id="status"
                  name="status"
                  options={[
                    { value: "pending", label: `⏳ ${t("status.pending")}` },
                    { value: "completed", label: `✅ ${t("status.completed")}` },
                    { value: "failed", label: `❌ ${t("status.failed")}` },
                  ]}
                  class="ring-stone-100/50"
                />
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
              {t("refunds.extra_info")}
            </h4>
            <div class="space-y-1.5">
              <div class="mb-1 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <label for="reason" class="text-[0.8rem] font-bold text-stone-600">{t("refunds.reason")}</label>
              </div>
              <TextInput
                id="reason"
                name="reason"
                placeholder={t("refunds.reason_placeholder")}
                class="w-full italic ring-stone-100/50"
              />
            </div>
          </div>
        </div>
      </CrudInlineForm>
    </div>
  </Drawer>

    <Table headers={activeHeaders}>
      {#if currentRefunds.length === 0}
        <TableEmptyState
          title={t("refunds.empty")}
          subtitle={isFetching ? t("common.loading") : t("common.no_results")}
          colspan={activeHeaders.length}
        />
      {/if}
    {#each currentRefunds as row (row.id)}
      <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          {#if columns[0].isVisible}
            <TableCell class="py-4 font-mono font-medium text-stone-600">
              <InlineEditableField
                value={row.orderNo}
                field="orderNo"
                ariaLabel={t("orders.order_no")}
                class="min-w-[120px]"
              />
            </TableCell>
          {/if}
          {#if columns[1].isVisible}
            <TableCell class="py-4">
              <InlineEditableField
                value={row.amount}
                field="amount"
                ariaLabel={t("refunds.amount")}
                class="w-24 text-center tabular-nums"
              />
            </TableCell>
          {/if}
          {#if columns[2].isVisible}
            <TableCell class="py-4">
              <select
                data-field="status"
                class="cursor-pointer rounded-lg border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 text-[0.7rem] font-bold tracking-wider text-stone-700 uppercase transition-all outline-none hover:border-[#c48a3a]/30 hover:bg-white focus:bg-white"
              >
                <option value="pending" selected={row.status === "pending"}>⏳ {t("status.pending")}</option>
                <option value="completed" selected={row.status === "completed"}>✅ {t("status.completed")}</option>
                <option value="failed" selected={row.status === "failed"}>❌ {t("status.failed")}</option>
              </select>
            </TableCell>
          {/if}
          {#if columns[3].isVisible}
            <TableCell class="py-4">
              <InlineEditableField
                value={row.reason || "-"}
                field="reason"
                ariaLabel={t("refunds.reason")}
                class="min-w-[150px] italic text-stone-500"
              />
            </TableCell>
          {/if}
        {#if columns[4].isVisible}
          <TableCell class="py-4 text-sm font-medium text-stone-500">
            {new Date(row.createdAt || "").toLocaleDateString(t("common.lang_code"), {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </TableCell>
        {/if}
        <TableCell align="center" class="py-4 pr-4">
          <RowActions
            isSaving={savingId === String(row.id)}
            isDeleting={deletingId === String(row.id)}
            onSave={(e) => handleAction(row.id, "save", (e as any).currentTarget.closest("tr"))}
            onDelete={() => handleAction(row.id, "delete", null)}
          />
        </TableCell>
      </TableRow>
    {/each}
  </Table>

  <ToastNotification bind:this={toastRef} />
</div>
</div>
