<script lang="ts">
  let {
    rows: initialShipments = [],
    total: initialTotal = 0,
    q = "",
    status = "",
    page = 1,
    limit = 20,
    lang,
  }: {
    rows: any[];
    total?: number;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    lang?: any;
  } = $props();
  initI18n(untrack(() => lang));

  import { trpc } from "@lib/trpc";
  import { createQuery } from "@tanstack/svelte-query";
  import { t, initI18n } from "@lib/i18n/store.svelte";
  import { onMount, untrack } from "svelte";
  import { fly } from "svelte/transition";
  import TableEmptyState from "@components/admin/ui/TableEmptyState.svelte";
  import InlineEditableField from "@components/admin/ui/forms/InlineEditableField.svelte";
  import Fab from "@components/admin/ui/Fab.svelte";
  import RowActions from "@components/admin/RowActions.svelte";
  import SectionHeader from "@components/admin/SectionHeader.svelte";
  import ToastNotification from "@components/admin/ToastNotification.svelte";
  import Table from "@components/admin/ui/Table.svelte";
  import TableRow from "@components/admin/ui/TableRow.svelte";
  import TableCell from "@components/admin/ui/TableCell.svelte";
  import Button from "@components/admin/ui/Button.svelte";
  import TextInput from "@components/admin/ui/forms/TextInput.svelte";
  import SelectInput from "@components/admin/ui/forms/SelectInput.svelte";
  import AdminHeaderFilters from "@components/admin/AdminHeaderFilters.svelte";
  import { createAdminFilters } from "@lib/admin-filters.svelte";
  import { createAdminMutation } from "@lib/admin-mutations.svelte";
  import { createTableState } from "@lib/admin-table-state.svelte";
  import AdminDrawerForm from "@components/admin/ui/overlay/AdminDrawerForm.svelte";
  import Badge from "@components/admin/ui/Badge.svelte";

  const filters = createAdminFilters({ q: untrack(() => q), status: untrack(() => status), page: untrack(() => page) });
  const localLimit = untrack(() => limit) || 20;

  let toastRef = $state<ToastNotification>();
  let isDrawerOpen = $state(false);
  let processingId = $state<string | null>(null);

  let columns = $state([
    { id: "orderNo", label: t("orders.order_no"), isVisible: true, class: "font-mono font-bold text-stone-900" },
    { id: "status", label: t("common.status"), isVisible: true },
    { id: "carrier", label: t("fulfillment.carrier"), isVisible: true },
    { id: "trackingNo", label: t("fulfillment.tracking_no"), isVisible: true },
    { id: "notes", label: t("fulfillment.internal_notes"), isVisible: true },
  ]);

  const query = createQuery(() => ({
    queryKey: ["shipments", filters.q, filters.status, filters.page],
    queryFn: () =>
      trpc.shipments.list.query({
        q: filters.q,
        status: filters.status ? [filters.status] : undefined,
        limit: localLimit,
        offset: (filters.page - 1) * localLimit,
      }),
    initialData: filters.isInitial ? { rows: initialShipments, total: initialTotal } : undefined,
  }));

  const currentRows = $derived(query.data?.rows || []);
  const tableState = createTableState<any>(() => currentRows);

  const updateMutation = createAdminMutation(
    (payload: { id: string; data: any }) => trpc.shipments.update.mutate(payload),
    {
      invalidateKeys: [["shipments"]],
      successMessage: t("fulfillment.toast_update"),
      onSuccess: () => tableState.reset(),
    },
    () => toastRef,
  );

  const deleteMutation = createAdminMutation(
    (id: string) => trpc.shipments.delete.mutate(id),
    {
      invalidateKeys: [["shipments"]],
      successMessage: t("fulfillment.toast_delete"),
    },
    () => toastRef,
  );

  const createMutation = createAdminMutation(
    (data: any) => trpc.shipments.create.mutate(data),
    {
      invalidateKeys: [["shipments"]],
      successMessage: t("fulfillment.toast_add"),
      onSuccess: () => {
        isDrawerOpen = false;
      },
    },
    () => toastRef,
  );

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const data = {
      orderNo: String(formData.get("orderNo")),
      status: String(formData.get("status")),
      carrier: (formData.get("carrier") as string) || null,
      trackingNo: (formData.get("trackingNo") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };
    await createMutation.mutate(data);
  };

  const handleSave = async (id: string) => {
    const updates = tableState.editedValues[id];
    if (!updates) return;
    processingId = id;
    try {
      await updateMutation.mutate({ id, data: updates });
    } finally {
      processingId = null;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("catalog.products.confirm_delete"))) return;
    processingId = id;
    try {
      await deleteMutation.mutate(id);
    } finally {
      processingId = null;
    }
  };

  const getStatusType = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "success";
      case "shipped":
        return "warning";
      case "pending":
        return "default";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  const activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("fulfillment.title")} muted={t("fulfillment.title_list")} />

      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="fulfillment" q={filters.q} status={filters.status} bind:columns {lang} />

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
              stroke-linejoin="round"
              ><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M12 8v8" /><path d="M8 12h8" /></svg
            >
            {t("fulfillment.title_create")}
          </div>
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("fulfillment.title_create")} />

    {#snippet fulfillmentIcon()}
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
        ><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle
          cx="5.5"
          cy="18.5"
          r="2.5"
        /><circle cx="18.5" cy="18.5" r="2.5" /></svg
      >
    {/snippet}

    <AdminDrawerForm
      bind:isOpen={isDrawerOpen}
      title={t("fulfillment.title_create")}
      subtitle={t("fulfillment.title_list")}
      icon={fulfillmentIcon}
      isSubmitting={createMutation.isPending}
      onsubmit={handleCreate}
      formId="fulfillment-form"
    >
      <div class="space-y-6">
        <TextInput id="orderNo" name="orderNo" label={t("orders.order_no")} required placeholder="ORD-123456" />

        <div class="grid grid-cols-2 gap-4">
          <SelectInput id="status" name="status" label={t("common.status")} required>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </SelectInput>
          <TextInput id="carrier" name="carrier" label={t("fulfillment.carrier")} placeholder="e.g. JNE, J&T" />
        </div>

        <TextInput id="trackingNo" name="trackingNo" label={t("fulfillment.tracking_no")} placeholder="Awb Number" />
        <TextInput id="notes" name="notes" label={t("fulfillment.internal_notes")} placeholder="Some notes..." />
      </div>
    </AdminDrawerForm>

    <Table headers={activeHeaders}>
      {#if currentRows.length === 0}
        <TableEmptyState title={t("fulfillment.empty")} colspan={activeHeaders.length} />
      {/if}
      {#each currentRows as row (row.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          {#if columns[0].isVisible}
            <TableCell class="py-4 font-mono font-bold text-stone-900">
              <InlineEditableField
                value={row.orderNo}
                oninput={(e: any) => tableState.onEdit(row.id, "orderNo", e.currentTarget.innerText)}
                field="orderNo"
              />
            </TableCell>
          {/if}
          {#if columns[1].isVisible}
            <TableCell class="py-4">
              <select
                onchange={(e) => tableState.onEdit(row.id, "status", e.currentTarget.value)}
                class="rounded-lg border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-bold uppercase transition-colors"
              >
                <option value="pending" selected={(tableState.editedValues[row.id]?.status ?? row.status) === "pending"}
                  >Pending</option
                >
                <option value="shipped" selected={(tableState.editedValues[row.id]?.status ?? row.status) === "shipped"}
                  >Shipped</option
                >
                <option
                  value="delivered"
                  selected={(tableState.editedValues[row.id]?.status ?? row.status) === "delivered"}>Delivered</option
                >
                <option
                  value="cancelled"
                  selected={(tableState.editedValues[row.id]?.status ?? row.status) === "cancelled"}>Cancelled</option
                >
              </select>
            </TableCell>
          {/if}
          {#if columns[2].isVisible}
            <TableCell class="py-4 font-medium text-stone-600">
              <InlineEditableField
                value={row.carrier || "-"}
                oninput={(e: any) => tableState.onEdit(row.id, "carrier", e.currentTarget.innerText)}
                field="carrier"
              />
            </TableCell>
          {/if}
          {#if columns[3].isVisible}
            <TableCell class="py-4 font-mono text-sm font-bold text-[#c48a3a]">
              <InlineEditableField
                value={row.trackingNo || "-"}
                oninput={(e: any) => tableState.onEdit(row.id, "trackingNo", e.currentTarget.innerText)}
                field="trackingNo"
              />
            </TableCell>
          {/if}
          {#if columns[4].isVisible}
            <TableCell class="py-4 text-sm text-stone-500 italic">
              <InlineEditableField
                value={row.notes || "-"}
                oninput={(e: any) => tableState.onEdit(row.id, "notes", e.currentTarget.innerText)}
                field="notes"
              />
            </TableCell>
          {/if}
          <TableCell align="center" class="py-4">
            <RowActions
              onSave={() => handleSave(row.id)}
              onDelete={() => handleDelete(row.id)}
              isSaving={processingId === row.id && updateMutation.isPending}
              isDeleting={processingId === row.id && deleteMutation.isPending}
            />
          </TableCell>
        </TableRow>
      {/each}
    </Table>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
