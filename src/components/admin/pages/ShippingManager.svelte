<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { actions } from "astro:actions";
  import Drawer from "../ui/overlay/Drawer.svelte";
  import Fab from "../ui/Fab.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import Textarea from "../ui/forms/Textarea.svelte";
  import Button from "../ui/Button.svelte";
  import InlineEditableField from "../ui/forms/InlineEditableField.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import ColumnVisibilityToggle from "../ui/ColumnVisibilityToggle.svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import { onMount, untrack } from "svelte";
  import { fade, fly } from "svelte/transition";

  export type RuleRow = {
    id: string | number;
    name: string;
    type: string;
    priority: number;
    configJson: string;
    isActive: boolean | number;
  };

  let { rows: initialRows = [], lang }: { rows: RuleRow[]; lang?: any } = $props();

  initI18n(untrack(() => lang));

  const queryClient = useQueryClient();
  let toastRef = $state<ToastNotification>();
  let isSubmitting = $state(false);
  let isDrawerOpen = $state(false);
  let isSimulateDrawerOpen = $state(false);

  let columns = $state([
    { id: "name", label: t("common.name"), isVisible: true },
    { id: "type", label: t("shipping_rules.type"), isVisible: true },
    { id: "priority", label: t("shipping_rules.priority"), isVisible: true },
    { id: "config", label: t("shipping_rules.config"), isVisible: true },
    { id: "status", label: t("common.status"), isVisible: true },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);

  let localQ = $state("");
  let localStatus = $state("");

  const rulesQuery = createQuery(() => ({
    queryKey: ["shippingRules.list"],
    queryFn: () => trpc.shippingRules.list.query(),
    initialData: initialRows.length > 0 ? initialRows : undefined,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  }));

  let currentRules = $derived.by(() => {
    const raw = (rulesQuery.data as RuleRow[]) || initialRows || [];
    let filtered = raw;
    if (localQ) {
      filtered = filtered.filter((r) => r?.name?.toLowerCase().includes(localQ.toLowerCase()));
    }
    if (localStatus) {
      const activeBool = localStatus === "active";
      filtered = filtered.filter((r) => r?.isActive === activeBool);
    }
    return filtered;
  });

  function syncFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    localQ = params.get("q") || "";
    localStatus = params.get("status") || "";
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

  // Reactive state for the create form
  let configType = $state("flat");
  let flatFee = $state(10000);
  let thresholdAmount = $state(150000);
  let thresholdFee = $state(10000);
  let zoneList = $state("");

  const currentConfig = $derived.by(() => {
    if (configType === "flat") return { fee: flatFee };
    if (configType === "free_threshold") return { threshold: thresholdAmount, fee: thresholdFee };
    if (configType === "zone") {
      const zones = zoneList
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [province, city, district, fee] = line.split("|");
          return {
            province: (province || "").trim(),
            city: (city || "").trim(),
            district: (district || "").trim(),
            fee: Number(fee || 0),
          };
        });
      return { zones };
    }
    return {};
  });

  const configPreview = $derived(JSON.stringify(currentConfig));

  let savingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    isSubmitting = true;
    try {
      await trpc.shippingRules.create.mutate({
        name: formData.get("name") as string,
        type: configType,
        priority: Number(formData.get("priority")),
        config: currentConfig,
        isActive: true,
      });

      toastRef?.show(t("shipping_rules.toast_add"), "success");
      form.reset();
      configType = "flat";
      flatFee = 10000;
      thresholdAmount = 150000;
      thresholdFee = 10000;
      zoneList = "";
      queryClient.invalidateQueries({ queryKey: ["shippingRules.list"] });
      isDrawerOpen = false;
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
      if (confirm(t("shipping_rules.confirm_delete"))) {
        deletingId = resolvedId;
        try {
          await trpc.shippingRules.delete.mutate(resolvedId);
          toastRef?.show(t("shipping_rules.toast_delete"), "success");
          queryClient.invalidateQueries({ queryKey: ["shippingRules.list"] });
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
        if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          fields[field] = el.value;
        } else {
          fields[field] = el.textContent?.trim() || "";
        }
      });

      const data = {
        name: fields.name,
        type: fields.type,
        priority: Number(fields.priority),
        config: fields.config ? (JSON.parse(fields.config) as Record<string, unknown>) : undefined,
        isActive: fields.isActive === "true",
      };

      savingId = resolvedId;
      try {
        await trpc.shippingRules.update.mutate({
          id: resolvedId,
          data,
        });
        toastRef?.show(t("shipping_rules.toast_update"), "success");
        queryClient.invalidateQueries({ queryKey: ["shippingRules.list"] });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : t("common.error_occurred");
        toastRef?.show(message, "error");
      } finally {
        savingId = null;
      }
    }
  };

  let isSimulating = $state(false);
  let simulateMessage = $state("");

  const handleSimulation = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const payload = {
      subtotal: Number(formData.get("subtotal") || 0),
      province: String(formData.get("province") || ""),
      city: String(formData.get("city") || ""),
      district: String(formData.get("district") || ""),
      freeShipping: formData.get("free_shipping") === "true",
    };

    isSimulating = true;
    simulateMessage = "";

    try {
      const { data, error } = await actions.simulateShipping(payload);
      if (!error && data) {
        simulateMessage = `${t(`shipping_rules.types.${data.rule}`)} | ${t("common.total")}: ${t("common.currency_symbol")} ${Number(data.fee || 0).toLocaleString(t("common.lang_code"))}`;
      } else if (error) {
        simulateMessage = `Error: ${error.message}`;
      }
    } finally {
      isSimulating = false;
    }
  };
</script>

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
      form="shipping-rule-form"
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
          <span class="text-[0.75rem] tracking-tight uppercase">{t("shipping_rules.save")}</span>
        </div>
      {/if}
    </Button>
  </div>
{/snippet}

{#snippet simulateIcon()}
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
    ><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg
  >
{/snippet}

{#snippet simulateDrawerFooter()}
  <div class="flex items-center gap-3">
    <button
      type="button"
      class="h-11 flex-1 rounded-2xl border border-stone-200 bg-white text-[0.7rem] font-black tracking-widest text-stone-400 uppercase transition-all hover:bg-stone-50 hover:text-stone-600 focus:outline-none active:scale-95 lg:h-[52px]"
      onclick={() => {
        isSimulateDrawerOpen = false;
        simulateMessage = "";
      }}
    >
      {t("common.close")}
    </button>
    <Button
      type="submit"
      form="simulate-form"
      variant="primary"
      class="relative flex h-11 flex-[2] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#c48a3a] px-8 py-0 font-black text-white shadow-[0_10px_30px_-10px_rgba(196,138,58,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_35px_-10px_rgba(196,138,58,0.6)] active:scale-[0.98] lg:h-[52px]"
      disabled={isSimulating}
    >
      {#if isSimulating}
        <div class="flex items-center gap-3">
          <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span class="text-xs">{t("common.processing")}</span>
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
            stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg
          >
          <span class="text-[0.75rem] tracking-tight uppercase">{t("shipping_rules.calculate")}</span>
        </div>
      {/if}
    </Button>
  </div>
{/snippet}

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("shipping_rules.title_list")} muted={t("shipping_rules.subtitle_list")} />
      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <div class="mr-2">
          <AdminHeaderFilters tab="shipping" q={localQ} status={localStatus} {columns} {lang} />
        </div>

        <ColumnVisibilityToggle bind:columns />

        <div class="h-10 w-px bg-stone-200/80"></div>

        <Button variant="simple" onclick={() => (isSimulateDrawerOpen = true)} class="group flex items-center gap-2">
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
            ><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" /><path d="m15 3 6 6" /><path d="M15 3v6h6" /><rect x="7" y="11" width="10" height="6" rx="1" /><path d="M10 14h4" /></svg
          >
          {t("shipping_rules.simulation_title")}
        </Button>
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
            {t("shipping_rules.add_rule")}
          </div>
        </Button>
      </div>
    </div>

    <!-- Mobile Actions Area -->
    <div class="mb-6 flex flex-col gap-3 lg:hidden">
      <Button
        variant="simple"
        onclick={() => (isSimulateDrawerOpen = true)}
        class="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white text-stone-600 shadow-sm"
      >
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
          ><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" /><path d="m15 3 6 6" /><path d="M15 3v6h6" /><rect x="7" y="11" width="10" height="6" rx="1" /><path d="M10 14h4" /></svg
        >
        {t("shipping_rules.simulation_title")}
      </Button>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("shipping_rules.add_rule")} />

  <Drawer
    bind:isOpen={isDrawerOpen}
    title={t("shipping_rules.title_add")}
    subtitle={t("shipping_rules.subtitle_add")}
    icon={shippingIcon}
    footer={drawerFooter}
    maxWidth="lg"
  >
    <div class="flex h-full flex-col px-5 py-6 lg:px-7 lg:py-8">
      <CrudInlineForm id="shipping-rule-form" onsubmit={handleCreate} {isSubmitting}>
        <div class="space-y-8">
          <div class="space-y-6">
            <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
              {t("shipping_rules.identity")}
            </h4>
            <div class="space-y-4">
              <div class="space-y-1.5">
                <div class="mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <label for="name" class="text-[0.8rem] font-bold text-stone-600">{t("shipping_rules.name")}</label>
                </div>
                <TextInput
                  id="name"
                  name="name"
                  required
                  placeholder={t("shipping_rules.name_placeholder")}
                  class="font-bold ring-stone-100/50"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <label for="type" class="text-[0.8rem] font-bold text-stone-600">{t("shipping_rules.type")}</label>
                  </div>
                  <SelectInput
                    id="type"
                    name="type"
                    bind:value={configType}
                    options={[
                      { value: "flat", label: `💵 ${t("shipping_rules.types.flat")}` },
                      { value: "free_threshold", label: `🛒 ${t("shipping_rules.types.free_threshold")}` },
                      { value: "zone", label: `🗺️ ${t("shipping_rules.types.zone")}` },
                    ]}
                    class="ring-stone-100/50"
                  />
                </div>
                <div class="space-y-1.5">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
                    <label for="priority" class="text-[0.8rem] font-bold text-stone-600">{t("common.priority")}</label>
                  </div>
                  <TextInput
                    id="priority"
                    name="priority"
                    type="number"
                    value="100"
                    class="font-bold tabular-nums ring-stone-100/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
              {t("shipping_rules.config")}
            </h4>
            <div class="space-y-4 rounded-2xl border border-stone-100 bg-stone-50/50 p-4">
              {#if configType === "flat"}
                <TextInput
                  id="flat_fee"
                  name="flat_fee"
                  type="number"
                  label={t("shipping_rules.flat_fee")}
                  bind:value={flatFee}
                  class="font-bold tabular-nums ring-stone-100/50"
                />
              {:else if configType === "free_threshold"}
                <div class="space-y-4">
                  <TextInput
                    id="threshold_amount"
                    name="threshold_amount"
                    type="number"
                    label={t("shipping_rules.free_threshold_min")}
                    bind:value={thresholdAmount}
                    class="font-bold tabular-nums ring-stone-100/50"
                  />
                  <TextInput
                    id="threshold_fee"
                    name="threshold_fee"
                    type="number"
                    label={t("shipping_rules.below_limit_fee")}
                    bind:value={thresholdFee}
                    class="font-bold tabular-nums ring-stone-100/50"
                  />
                </div>
              {:else if configType === "zone"}
                <div>
                  <Textarea
                    id="zone_list"
                    name="zone_list"
                    label={t("shipping_rules.zone_list")}
                    rows={4}
                    bind:value={zoneList}
                    placeholder={t("shipping_rules.zone_placeholder")}
                    class="font-mono ring-stone-100/50"
                  />
                  <p class="mt-1 text-[10px] text-stone-400 italic">
                    {t("shipping_rules.zone_help")}
                  </p>
                </div>
              {/if}

              <div class="pt-2">
                <Textarea
                  id="config_preview"
                  name="config_preview"
                  label={t("shipping_rules.json_preview")}
                  rows={2}
                  value={configPreview}
                  readonly
                  class="cursor-default bg-stone-100 text-[11px] text-stone-500"
                />
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-[#c48a3a]/10 bg-[#c48a3a]/5 p-5 text-[#865d25]">
            <div class="flex gap-3">
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
                class="mt-1 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg
              >
              <div>
                <h4 class="text-[0.75rem] font-black tracking-wider uppercase">{t("catalog.categories.tips_title")}</h4>
                <p class="mt-1 text-[0.8rem] leading-relaxed font-medium">
                  {t("shipping_rules.priority_help")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CrudInlineForm>
    </div>
  </Drawer>

  <Drawer
    bind:isOpen={isSimulateDrawerOpen}
    title={t("shipping_rules.simulation_title")}
    subtitle={t("shipping_rules.simulation_subtitle")}
    icon={simulateIcon}
    footer={simulateDrawerFooter}
    maxWidth="md"
  >
    <div class="flex h-full flex-col px-5 py-6 lg:px-7 lg:py-8">
      <CrudInlineForm id="simulate-form" onsubmit={handleSimulation} isSubmitting={isSimulating}>
        <div class="space-y-8">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2 space-y-1.5">
              <div class="mb-1 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <label for="subtotal" class="text-[0.8rem] font-bold text-stone-600">{t("shipping_rules.subtotal")}</label>
              </div>
              <TextInput
                id="subtotal"
                name="subtotal"
                type="number"
                value="150000"
                class="font-bold tabular-nums ring-stone-100/50"
              />
            </div>
            
            <div class="space-y-1.5">
              <div class="mb-1 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <label for="province" class="text-[0.8rem] font-bold text-stone-600">{t("shipping_rules.province")}</label>
              </div>
              <TextInput
                id="province"
                name="province"
                value="DI Yogyakarta"
                class="ring-stone-100/50"
              />
            </div>

            <div class="space-y-1.5">
              <div class="mb-1 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
                <label for="city" class="text-[0.8rem] font-bold text-stone-600">{t("shipping_rules.city")}</label>
              </div>
              <TextInput
                id="city"
                name="city"
                value="Bantul"
                class="ring-stone-100/50"
              />
            </div>

            <div class="space-y-1.5">
              <div class="mb-1 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <label for="district" class="text-[0.8rem] font-bold text-stone-600">{t("shipping_rules.district")}</label>
              </div>
              <TextInput
                id="district"
                name="district"
                value="Sewon"
                class="ring-stone-100/50"
              />
            </div>

            <div class="space-y-1.5">
              <div class="mb-1 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
                <label for="free_shipping" class="text-[0.8rem] font-bold text-stone-600">{t("shipping_rules.promo_label")}</label>
              </div>
              <SelectInput
                id="free_shipping"
                name="free_shipping"
                options={[
                  { value: "false", label: t("shipping_rules.promo_no") },
                  { value: "true", label: t("shipping_rules.promo_yes") },
                ]}
                class="ring-stone-100/50"
              />
            </div>
          </div>

          {#if simulateMessage}
            <div class="space-y-3" transition:fade={{ duration: 200 }}>
              <h4 class="text-[0.65rem] font-black tracking-widest text-stone-400 uppercase">
                {t("common.result")}
              </h4>
              <div
                class="flex items-center gap-4 rounded-2xl bg-stone-900 p-6 text-white shadow-2xl shadow-stone-900/20"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl backdrop-blur-sm"
                >
                  {simulateMessage.includes(t("common.error")) ? "❌" : "✅"}
                </div>
                <div>
                  <div class="text-[10px] font-black tracking-wider text-white/50 uppercase">
                    {t("shipping_rules.estimated_fee")}
                  </div>
                  <div class="font-mono text-lg font-bold leading-none tracking-tight">
                    {simulateMessage}
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </CrudInlineForm>
    </div>
  </Drawer>

    <Table headers={activeHeaders}>
      {#if currentRules.length === 0}
        <TableEmptyState
          title={t("shipping_rules.empty")}
          subtitle={t("shipping_rules.empty_desc") || t("common.no_results")}
          colspan={activeHeaders.length}
        />
      {/if}
      {#each currentRules as row (row.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          {#if columns[0].isVisible}
            <TableCell class="py-4">
              <InlineEditableField
                value={row.name}
                field="name"
                ariaLabel={t("shipping_rules.name")}
                class="min-w-[150px]"
              />
            </TableCell>
          {/if}
          {#if columns[1].isVisible}
            <TableCell class="py-4">
              <select
                data-field="type"
                class="cursor-pointer rounded-lg border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 text-xs font-bold uppercase transition-all outline-none hover:border-[#c48a3a]/30 hover:bg-white focus:bg-white"
              >
                <option value="flat" selected={row.type === "flat"}>💵 {t("shipping_rules.types.flat")}</option>
                <option value="free_threshold" selected={row.type === "free_threshold"}
                  >🛒 {t("shipping_rules.types.free_threshold")}</option
                >
                <option value="zone" selected={row.type === "zone"}>🗺️ {t("shipping_rules.types.zone")}</option>
              </select>
            </TableCell>
          {/if}
          {#if columns[2].isVisible}
            <TableCell class="py-4">
              <InlineEditableField
                value={row.priority}
                field="priority"
                ariaLabel={t("shipping_rules.priority")}
                class="w-20 text-center tabular-nums"
              />
            </TableCell>
          {/if}
          {#if columns[3].isVisible}
            <TableCell class="py-4">
              <textarea
                data-field="config"
                rows="2"
                class="w-full min-w-[200px] resize-none rounded-lg border border-transparent bg-transparent px-3 py-1.5 font-mono text-[10px] transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
                >{row.configJson}</textarea
              >
            </TableCell>
          {/if}
          {#if columns[4].isVisible}
            <TableCell class="py-4 text-center">
              <select
                data-field="isActive"
                class="cursor-pointer rounded-lg border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 text-[0.7rem] font-bold tracking-wider text-stone-700 uppercase transition-all outline-none hover:border-[#c48a3a]/30 hover:bg-white focus:bg-white"
              >
                <option value="true" selected={!!row.isActive}>{t("common.active_status").toUpperCase()}</option>
                <option value="false" selected={!row.isActive}>{t("common.inactive_status").toUpperCase()}</option>
              </select>
            </TableCell>
          {/if}
          <TableCell class="py-4 pr-4 text-right">
            <RowActions
              isSaving={savingId === row.id}
              isDeleting={deletingId === row.id}
              onSave={(e) => handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
              onDelete={() => handleRowAction(row.id, "delete", null)}
            />
          </TableCell>
        </TableRow>
      {/each}
    </Table>
  
  <ToastNotification bind:this={toastRef} />
  </div>
</div>
