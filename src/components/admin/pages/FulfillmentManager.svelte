<script module lang="ts">
  export type ShipmentRow = {
    id: string | number;
    orderNo: string;
    status: string;
    carrier?: string | null;
    trackingNo?: string | null;
    notes?: string | null;
  };
</script>

<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { createQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import { onMount, untrack } from "svelte";
  import { fade, fly } from "svelte/transition";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import InlineEditableField from "../ui/forms/InlineEditableField.svelte";
  import Drawer from "../ui/overlay/Drawer.svelte";
  import Fab from "../ui/Fab.svelte";
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
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import ColumnVisibilityToggle from "../ui/ColumnVisibilityToggle.svelte";

  let {
    rows: initialShipments = [],
    total: initialTotal = 0,
    q = "",
    status = "",
    page = 1,
    limit = 20,
    lang,
  }: {
    rows: ShipmentRow[];
    total?: number;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();

  initI18n(untrack(() => lang));

  const offset = $derived((page - 1) * limit);
  const queryClient = useQueryClient();
  let toastRef = $state<ToastNotification>();
  let isDrawerOpen = $state(false);

  let columns = $state([
    { id: "orderNo", label: t("orders.order_no"), isVisible: true, class: "font-mono font-bold text-stone-900" },
    { id: "status", label: t("common.status"), isVisible: true, class: "" },
    { id: "carrier", label: t("fulfillment.carrier"), isVisible: true, class: "font-medium text-stone-600" },
    { id: "trackingNo", label: t("fulfillment.tracking_no"), isVisible: true, class: "font-mono text-sm font-bold text-[#c48a3a]" },
    { id: "notes", label: t("fulfillment.internal_notes"), isVisible: true, class: "text-sm text-stone-500 italic" },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);

  // Query for existing shipments
  const shipmentsQuery = createQuery(() => ({
    queryKey: ["shipments", { q, status, limit, offset }],
    queryFn: () => trpc.shipments.list.query({ q, status: status ? [status] : undefined, limit, offset }),
    initialData: initialShipments.length > 0 ? { rows: initialShipments, total: initialTotal } : undefined,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  }));

  // Query for orders that need fulfillment
  const ordersFulfillmentQuery = createQuery(() => ({
    queryKey: ["orders", "fulfillment"],
    queryFn: () => trpc.orders.fulfillment.query({}),
  }));

  const shipCreateMutation = createMutation(() => ({
    mutationFn: (data: any) => trpc.shipments.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toastRef?.show(t("fulfillment.toast_create"), "success");
      isDrawerOpen = false;
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : t("common.error_occurred");
      toastRef?.show(message, "error");
    },
  }));

  const shipUpdateMutation = createMutation(() => ({
    mutationFn: (payload: { id: string; data: any }) => trpc.shipments.update.mutate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toastRef?.show(t("fulfillment.toast_update"), "success");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : t("common.error_occurred");
      toastRef?.show(message, "error");
    },
  }));

  const shipDeleteMutation = createMutation(() => ({
    mutationFn: (id: string) => trpc.shipments.delete.mutate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toastRef?.show(t("fulfillment.toast_delete"), "success");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : t("common.error_occurred");
      toastRef?.show(message, "error");
    },
  }));

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const orderNo = data.get("orderNo") as string;

    const order = pendingOrders.find((o: any) => o.orderNo === orderNo);
    if (!order) {
      toastRef?.show(t("fulfillment.order_not_found"), "error");
      return;
    }

    shipCreateMutation.mutate({
      orderId: order.id,
      orderNo: orderNo,
      status: data.get("status") as string,
      carrier: data.get("carrier") as string,
      trackingNo: data.get("trackingNo") as string,
      notes: data.get("notes") as string,
    });
    form.reset();
  };

  const handleRowAction = (id: string | number, action: string, rowElement: HTMLElement | null) => {
    if (action === "delete") {
      if (confirm(t("fulfillment.confirm_delete"))) {
        shipDeleteMutation.mutate(String(id));
      }
    } else if (action === "save" && rowElement) {
      const data: any = {};
      rowElement.querySelectorAll("[data-field]").forEach((el) => {
        if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
          data[el.getAttribute("data-field")!] = el.value;
        } else {
          data[el.getAttribute("data-field")!] = (el as HTMLElement).textContent?.trim();
        }
      });
      shipUpdateMutation.mutate({ id: String(id), data: data as any });
    }
  };

  let currentShipments = $derived((shipmentsQuery.data?.rows as ShipmentRow[]) || initialShipments);
  let pendingOrders = $derived(ordersFulfillmentQuery.data || []);
</script>

{#snippet shipmentIcon()}
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
    ><path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5" /><path d="M14 17h1" /><circle
      cx="7.5"
      cy="17.5"
      r="2.5"
    /><circle cx="17.5" cy="17.5" r="2.5" /></svg
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
      form="shipment-form"
      variant="primary"
      class="relative flex h-11 flex-[2] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#c48a3a] px-8 py-0 font-black text-white shadow-[0_10px_30px_-10px_rgba(196,138,58,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_35px_-10px_rgba(196,138,58,0.6)] active:scale-[0.98] lg:h-[52px]"
      disabled={shipCreateMutation.isPending}
    >
      {#if shipCreateMutation.isPending}
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
          <span class="text-[0.75rem] tracking-tight uppercase">{t("fulfillment.create_tracking")}</span>
        </div>
      {/if}
    </Button>
  </div>
{/snippet}

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
  <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
    <SectionHeader title={t("fulfillment.title_list")} muted={t("fulfillment.badge_tracking")} />
    <div class="hidden lg:flex lg:items-center lg:gap-3">
      <div class="mr-2">
        <AdminHeaderFilters tab="fulfillment" {q} {status} {columns} />
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
          {t("fulfillment.create_tracking")}
        </div>
      </Button>
    </div>
  </div>

  <Fab onclick={() => (isDrawerOpen = true)} label={t("fulfillment.create_tracking")} />

  <Drawer
    bind:isOpen={isDrawerOpen}
    title={t("fulfillment.title_create")}
    subtitle={t("fulfillment.badge_tracking")}
    icon={shipmentIcon}
    footer={drawerFooter}
    maxWidth="lg"
  >
    <div class="flex h-full flex-col px-5 py-6 lg:px-7 lg:py-8">
      <CrudInlineForm id="shipment-form" onsubmit={handleCreate} isSubmitting={shipCreateMutation.isPending}>
        <div class="space-y-8">
          <div class="space-y-6">
            <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
              {t("fulfillment.basic_info")}
            </h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2 space-y-1.5">
                <div class="mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="8" x2="16" y1="10" y2="10"/><line x1="8" x2="16" y1="14" y2="14"/><line x1="8" x2="16" y1="18" y2="18"/></svg>
                  <label for="orderNo" class="text-[0.8rem] font-bold text-stone-600">{t("fulfillment.order_no")}</label>
                </div>
                <TextInput
                  id="orderNo"
                  name="orderNo"
                  required
                  placeholder={t("fulfillment.order_no_placeholder")}
                  list="pending-orders"
                  class="w-full font-bold ring-stone-100/50"
                />
                <datalist id="pending-orders">
                  {#each pendingOrders as order}
                    <option value={order.orderNo}>{order.customerName}</option>
                  {/each}
                  {#if pendingOrders.length === 0}
                    <option value="" disabled>{t("fulfillment.no_orders_to_process")}</option>
                  {/if}
                </datalist>
              </div>
              <div class="space-y-1.5">
                <div class="mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                  <label for="status" class="text-[0.8rem] font-bold text-stone-600">{t("fulfillment.initial_status")}</label>
                </div>
                <SelectInput
                  id="status"
                  name="status"
                  options={[
                    { value: "packing", label: `📦 ${t("status.packing")}` },
                    { value: "shipped", label: `🚚 ${t("status.shipped")}` },
                    { value: "delivered", label: `✅ ${t("status.delivered")}` },
                    { value: "cancelled", label: `❌ ${t("status.cancelled")}` },
                  ]}
                  class="ring-stone-100/50"
                />
              </div>
              <div class="space-y-1.5 relative">
                <div class="mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                  <label for="carrier" class="text-[0.8rem] font-bold text-stone-600">{t("fulfillment.carrier")}</label>
                </div>
                <TextInput
                  id="carrier"
                  name="carrier"
                  list="kurir-options"
                  placeholder={t("fulfillment.carrier_placeholder")}
                  class="w-full ring-stone-100/50"
                />
                <datalist id="kurir-options">
                  <option value="JNE Express"></option>
                  <option value="J&T Express"></option>
                  <option value="SiCepat Ekspres"></option>
                  <option value="Anteraja"></option>
                  <option value="Pos Indonesia"></option>
                  <option value="GoSend"></option>
                  <option value="GrabExpress"></option>
                  <option value="Paxel"></option>
                </datalist>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
              {t("fulfillment.extra_info")}
            </h4>
            <div class="space-y-4">
              <div class="space-y-1.5">
                <div class="mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
                  <label for="trackingNo" class="text-[0.8rem] font-bold text-stone-600">{t("fulfillment.tracking_no")}</label>
                </div>
                <TextInput
                  id="trackingNo"
                  name="trackingNo"
                  placeholder={t("fulfillment.tracking_no_placeholder")}
                  class="w-full font-mono ring-stone-100/50"
                />
              </div>
              <div class="space-y-1.5">
                <div class="mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <label for="notes" class="text-[0.8rem] font-bold text-stone-600">{t("fulfillment.internal_notes")}</label>
                </div>
                <TextInput
                  id="notes"
                  name="notes"
                  placeholder={t("fulfillment.internal_notes_placeholder")}
                  class="w-full ring-stone-100/50"
                />
              </div>
            </div>
          </div>
        </div>
      </CrudInlineForm>
    </div>
  </Drawer>

    <Table headers={activeHeaders}>
      {#if currentShipments.length === 0}
        <TableEmptyState
          title={t("fulfillment.empty")}
          subtitle={t("common.no_results")}
          colspan={activeHeaders.length}
        />
      {/if}
    {#each currentShipments as row (row.id)}
      <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          {#if columns[0].isVisible}
            <TableCell class="py-4">
              <InlineEditableField
                value={row.orderNo}
                field="orderNo"
                ariaLabel={t("orders.order_no")}
                class="min-w-[120px] font-mono font-bold text-stone-900"
              />
            </TableCell>
          {/if}
          {#if columns[1].isVisible}
            <TableCell class="py-4">
              <select
                data-field="status"
                class="cursor-pointer rounded-lg border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 text-[0.7rem] font-bold tracking-wider text-stone-700 uppercase transition-all outline-none hover:border-[#c48a3a]/30 hover:bg-white focus:bg-white"
              >
                <option value="packing" selected={row.status === "packing"}>📦 {t("status.packing")}</option>
                <option value="shipped" selected={row.status === "shipped"}>🚚 {t("status.shipped")}</option>
                <option value="delivered" selected={row.status === "delivered"}>✅ {t("status.delivered")}</option>
                <option value="cancelled" selected={row.status === "cancelled"}>❌ {t("status.cancelled")}</option>
              </select>
            </TableCell>
          {/if}
          {#if columns[2].isVisible}
            <TableCell class="py-4">
              <InlineEditableField
                value={row.carrier || "-"}
                field="carrier"
                ariaLabel={t("fulfillment.carrier")}
                class="min-w-[120px] font-medium text-stone-600"
              />
            </TableCell>
          {/if}
          {#if columns[3].isVisible}
            <TableCell class="py-4">
              <InlineEditableField
                value={row.trackingNo || "-"}
                field="trackingNo"
                ariaLabel={t("fulfillment.tracking_no")}
                class="min-w-[120px] font-mono text-sm font-bold text-[#c48a3a]"
              />
            </TableCell>
          {/if}
          {#if columns[4].isVisible}
            <TableCell class="py-4">
              <InlineEditableField
                value={row.notes || "-"}
                field="notes"
                ariaLabel={t("fulfillment.internal_notes")}
                class="min-w-[150px] text-sm text-stone-500 italic"
              />
            </TableCell>
          {/if}
        <TableCell class="py-4 pr-4 text-right">
          <RowActions
            isSaving={shipUpdateMutation.isPending && (shipUpdateMutation.variables as any)?.id === row.id}
            isDeleting={shipDeleteMutation.isPending && (shipDeleteMutation.variables as any) === row.id}
            onSave={(e) => handleRowAction(row.id, "save", (e as any).currentTarget.closest("tr"))}
            onDelete={() => handleRowAction(row.id, "delete", null)}
          />
        </TableCell>
      </TableRow>
    {/each}
  </Table>

  <ToastNotification bind:this={toastRef} />
</div>
</div>

