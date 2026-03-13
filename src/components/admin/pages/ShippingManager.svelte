<script lang="ts">
  let {
    rows: initialRows = [],
    q = "",
    status = "",
    page = 1,
    lang,
  }: {
    rows?: any[];
    q?: string;
    status?: string;
    page?: number;
    lang?: any;
  } = $props();
  initI18n(untrack(() => lang));

  import { trpc } from "../../../lib/trpc";
  import { createQuery } from "@tanstack/svelte-query";
  import { untrack, onMount } from "svelte";
  import { fly } from "svelte/transition";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Badge from "../ui/Badge.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import AdminDrawerForm from "../ui/overlay/AdminDrawerForm.svelte";
  import Fab from "../ui/Fab.svelte";
  import { createAdminFilters } from "../../../lib/admin-filters.svelte";
  import { createAdminMutation } from "../../../lib/admin-mutations.svelte";
  import { createTableState } from "../../../lib/admin-table-state.svelte";

  const filters = createAdminFilters({ q: untrack(() => q), status: untrack(() => status), page: untrack(() => page) });

  let toastRef = $state<ToastNotification>();
  let isDrawerOpen = $state(false);
  let processingId = $state<string | null>(null);

  const query = createQuery(() => ({
    queryKey: ["shippingRules"],
    queryFn: () => trpc.shippingRules.list.query(),
    initialData: filters.isInitial ? initialRows : undefined,
  }));

  const currentRows = $derived(query.data || []);

  const tableState = createTableState<any>(() => currentRows);

  const updateMutation = createAdminMutation(
    (payload: { id: string; data: any }) => trpc.shippingRules.update.mutate(payload),
    {
      invalidateKeys: [["shippingRules"]],
      successMessage: t("shipping_rules.toast_update"),
      onSuccess: () => tableState.reset(),
    },
    () => toastRef,
  );

  const deleteMutation = createAdminMutation(
    (id: string) => trpc.shippingRules.delete.mutate(id),
    {
      invalidateKeys: [["shippingRules"]],
      successMessage: t("shipping_rules.toast_delete"),
    },
    () => toastRef,
  );

  const createMutation = createAdminMutation(
    (data: any) => trpc.shippingRules.create.mutate(data),
    {
      invalidateKeys: [["shippingRules"]],
      successMessage: t("shipping_rules.toast_add"),
      onSuccess: () => {
        isDrawerOpen = false;
      },
    },
    () => toastRef,
  );

  // Form State for creating new rule
  let configType = $state("flat");
  let flatFee = $state(10000);
  let thresholdAmount = $state(150000);

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const data = {
      name: String(formData.get("name")),
      type: configType,
      config: {
        type: configType,
        flatFee: configType === "flat" ? Number(flatFee) : 0,
        thresholdAmount: configType === "free_above" ? Number(thresholdAmount) : 0,
      },
      isActive: formData.get("isActive") === "true",
    };
    await createMutation.mutate(data);
  };

  const handleSave = async (id: string) => {
    const edited = tableState.getEditedRow(id);
    if (!edited) return;

    // Prepare data for TRPC update
    const data: any = { ...edited };
    if (data.isActive !== undefined) data.isActive = data.isActive === 1 || data.isActive === true;
    if (data.config) data.config = JSON.parse(data.configJson || "{}");

    processingId = id;
    try {
      await updateMutation.mutate({ id, data });
      tableState.clearChanges(id);
    } finally {
      processingId = null;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("common.confirm_delete"))) return;
    processingId = id;
    try {
      await deleteMutation.mutate(id);
    } finally {
      processingId = null;
    }
  };

  let columns = $state([
    { id: "name", label: t("shipping_rules.name"), isVisible: true },
    { id: "type", label: t("shipping_rules.type"), isVisible: true },
    { id: "config", label: t("shipping_rules.config"), isVisible: true },
    { id: "status", label: t("common.status"), isVisible: true },
  ]);

  const activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);

  const parseConfig = (json: string) => {
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  };
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("shipping_rules.title_list")} muted={t("shipping_rules.subtitle_list")} />

      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="shipping" q={filters.q} status={filters.status} bind:columns {lang} />

        <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex items-center gap-2">
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
          {t("shipping_rules.add_rule")}
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("shipping_rules.add_rule")} />

    {#snippet shippingIcon()}
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
        ><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg
      >
    {/snippet}

    <AdminDrawerForm
      bind:isOpen={isDrawerOpen}
      title={t("shipping_rules.title_add")}
      subtitle={t("shipping_rules.subtitle_list")}
      icon={shippingIcon}
      isSubmitting={createMutation.isPending}
      onsubmit={handleCreate}
      formId="shipping-form"
    >
      <div class="space-y-6">
        <TextInput id="name" name="name" label={t("shipping_rules.name")} required />

        <SelectInput id="configType" name="configType" label={t("shipping_rules.type")} bind:value={configType}>
          <option value="flat">Flat Fee</option>
          <option value="free_above">Free Above Threshold</option>
          <option value="weight_based">Weight Based</option>
        </SelectInput>

        {#if configType === "flat"}
          <TextInput id="flatFee" name="flatFee" label="Flat Fee" type="number" bind:value={flatFee} />
        {:else if configType === "free_above"}
          <TextInput
            id="thresholdAmount"
            name="thresholdAmount"
            label="Threshold Amount"
            type="number"
            bind:value={thresholdAmount}
          />
        {/if}

        <SelectInput id="isActive" name="isActive" label={t("common.status")}>
          <option value="true">{t("common.active")}</option>
          <option value="false">{t("common.inactive")}</option>
        </SelectInput>
      </div>
    </AdminDrawerForm>

    <div class="mt-4">
      <Table headers={activeHeaders}>
        {#if currentRows.length === 0}
          <TableEmptyState title={t("shipping_rules.empty")} colspan={activeHeaders.length} />
        {/if}
        {#each currentRows as row (row.id)}
          {@const config = parseConfig(row.configJson)}
          <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
            {#if columns[0].isVisible}
              <TableCell class="py-4">
                <div class="flex flex-col">
                  <span class="font-bold text-stone-900">{row.name}</span>
                </div>
              </TableCell>
            {/if}
            {#if columns[1].isVisible}
              <TableCell class="py-4 font-medium text-stone-600 capitalize">{row.type || "-"}</TableCell>
            {/if}
            {#if columns[2].isVisible}
              <TableCell class="py-4 text-xs text-stone-500">
                {#if row.type === "flat"}
                  Fee: {t("common.currency_symbol")} {config.flatFee?.toLocaleString()}
                {:else if row.type === "free_above"}
                  Free > {t("common.currency_symbol")} {config.thresholdAmount?.toLocaleString()}
                {:else}
                  -
                {/if}
              </TableCell>
            {/if}
            {#if columns[3].isVisible}
              <TableCell class="py-4">
                <Badge variant={row.isActive ? "success" : "default"}>
                  {row.isActive ? t("common.active") : t("common.inactive")}
                </Badge>
              </TableCell>
            {/if}
            <TableCell align="center" class="py-4">
              <RowActions
                isSaving={processingId === row.id && updateMutation.isPending}
                onSave={() => handleSave(row.id)}
                onDelete={() => handleDelete(row.id)}
                isDeleting={processingId === row.id && deleteMutation.isPending}
              />
            </TableCell>
          </TableRow>
        {/each}
      </Table>
    </div>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
