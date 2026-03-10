<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { fade, fly } from "svelte/transition";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { actions } from "astro:actions";
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
  import Textarea from "../ui/forms/Textarea.svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import { onMount } from "svelte";

  export type RuleRow = {
    id: string | number;
    name: string;
    type: string;
    priority: number;
    configJson: string;
    isActive: boolean | number;
  };

  type ShippingRuleInput = {
    name: string;
    type: string;
    priority: number;
    config: Record<string, unknown>;
    isActive: boolean | number;
  };

  let { rows: initialRows = [] }: { rows: RuleRow[] } = $props();

  const queryClient = useQueryClient();
  let toastRef = $state<ToastNotification>();
  let isSubmitting = $state(false);
  let isDrawerOpen = $state(false);

  const rulesQuery = createQuery(() => ({
    queryKey: ["shippingRules.list"],
    queryFn: () => trpc.shippingRules.list.query(),
    initialData: initialRows.length > 0 ? initialRows : undefined,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  }));

  let currentRules = $derived((rulesQuery.data as RuleRow[]) || initialRows);

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

<div class="mt-2 mb-8 flex items-center justify-between">
  <SectionHeader title={t("shipping_rules.title_list")} muted={t("shipping_rules.subtitle_list")} />
  <Button class="flex items-center gap-2" onclick={() => (isDrawerOpen = true)}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
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

{#if isDrawerOpen}
  <div class="fixed inset-0 z-[100] flex justify-end">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
      transition:fade={{ duration: 200 }}
      onclick={() => (isDrawerOpen = false)}
    ></div>

    <div
      class="relative z-[101] flex h-full w-full max-w-lg flex-col border-l border-stone-100 bg-white shadow-2xl"
      transition:fly={{ x: 400, opacity: 1, duration: 300 }}
    >
      <div class="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 px-6 py-5">
        <div>
          <h3 class="text-lg font-bold text-stone-800">{t("shipping_rules.title_add")}</h3>
          <p class="mt-0.5 text-xs font-semibold tracking-wider text-stone-400 uppercase">
            {t("shipping_rules.subtitle_add")}
          </p>
        </div>
        <button
          class="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-200"
          onclick={() => (isDrawerOpen = false)}
          aria-label={t("common.close")}
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
            stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
          >
        </button>
      </div>

      <div class="custom-scrollbar w-full flex-1 overflow-y-auto">
        <CrudInlineForm id="shipping-rule-form" onsubmit={handleCreate} {isSubmitting}>
          <div class="space-y-8 p-6">
            <div class="space-y-6">
              <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
                {t("shipping_rules.identity")}
              </h4>
              <div class="space-y-4">
                <div>
                  <TextInput
                    id="name"
                    name="name"
                    label={t("shipping_rules.name")}
                    required
                    placeholder={t("shipping_rules.name_placeholder")}
                    class="font-bold"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <SelectInput
                      id="type"
                      name="type"
                      label={t("shipping_rules.type")}
                      bind:value={configType}
                      options={[
                        { value: "flat", label: `💵 ${t("shipping_rules.types.flat")}` },
                        { value: "free_threshold", label: `🛒 ${t("shipping_rules.types.free_threshold")}` },
                        { value: "zone", label: `🗺️ ${t("shipping_rules.types.zone")}` },
                      ]}
                    />
                  </div>
                  <div>
                    <TextInput
                      id="priority"
                      name="priority"
                      type="number"
                      label={t("common.priority")}
                      value="100"
                      class="font-bold tabular-nums"
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
                  <div id="flat-config">
                    <TextInput
                      id="flat_fee"
                      name="flat_fee"
                      type="number"
                      label={t("shipping_rules.flat_fee")}
                      bind:value={flatFee}
                      class="font-bold tabular-nums"
                    />
                  </div>
                {:else if configType === "free_threshold"}
                  <div id="threshold-config" class="space-y-4">
                    <div>
                      <TextInput
                        id="threshold_amount"
                        name="threshold_amount"
                        type="number"
                        label={t("shipping_rules.free_threshold_min")}
                        bind:value={thresholdAmount}
                        class="font-bold tabular-nums"
                      />
                    </div>
                    <div>
                      <TextInput
                        id="threshold_fee"
                        name="threshold_fee"
                        type="number"
                        label={t("shipping_rules.below_limit_fee")}
                        bind:value={thresholdFee}
                        class="font-bold tabular-nums"
                      />
                    </div>
                  </div>
                {:else if configType === "zone"}
                  <div id="zone-config">
                    <Textarea
                      id="zone_list"
                      name="zone_list"
                      label={t("shipping_rules.zone_list")}
                      rows={4}
                      bind:value={zoneList}
                      placeholder={t("shipping_rules.zone_placeholder")}
                      class="font-mono"
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
              <div class="border-t border-stone-100 pt-2">
                <p class="mt-4 mb-2 text-xs text-stone-400 italic">
                  {t("shipping_rules.priority_help")}
                </p>
              </div>
            </div>
          </div>

          <div class="sticky bottom-0 z-10 mt-auto w-full border-t border-stone-100 bg-stone-50/30 p-6 pt-4">
            <Button type="submit" variant="primary" class="h-[46px] w-full" disabled={isSubmitting}>
              {#if isSubmitting}
                <svg class="mr-1 inline h-4 w-4 animate-spin" viewBox="0 0 24 24"
                  ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              {:else}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="mr-2"><path d="M5 12h14" /><path d="M12 5v14" /></svg
                >
              {/if}
              {t("shipping_rules.save")}
            </Button>
          </div>
        </CrudInlineForm>
      </div>
    </div>
  </div>
{/if}

<div class="mt-6">
  <SectionHeader title={t("shipping_rules.title_list")} muted={t("catalog.categories.tips_desc")} />
</div>
<div class="mt-6">
  <SectionHeader title={t("shipping_rules.simulation_title")} badge={t("shipping_rules.simulation_subtitle")} />
  <div class="mt-4 max-w-5xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <CrudInlineForm class="p-8" onsubmit={handleSimulation} isSubmitting={isSimulating}>
      <div class="grid grid-cols-2 gap-6 lg:grid-cols-5">
        <div>
          <TextInput
            id="subtotal"
            name="subtotal"
            type="number"
            label={t("shipping_rules.subtotal")}
            value="150000"
            class="font-bold tabular-nums"
          />
        </div>
        <div>
          <TextInput id="province" name="province" label={t("shipping_rules.province")} value="DI Yogyakarta" />
        </div>
        <div>
          <TextInput id="city" name="city" label={t("shipping_rules.city")} value="Bantul" />
        </div>
        <div>
          <TextInput id="district" name="district" label={t("shipping_rules.district")} value="Sewon" />
        </div>
        <div>
          <SelectInput
            id="free_shipping"
            name="free_shipping"
            label={t("shipping_rules.promo_label")}
            options={[
              { value: "false", label: t("shipping_rules.promo_no") },
              { value: "true", label: t("shipping_rules.promo_yes") },
            ]}
          />
        </div>
      </div>
      <div class="mt-8 flex flex-col items-center gap-4 sm:flex-row">
        <Button type="submit" variant="primary" class="h-[42px] w-full px-8 sm:w-auto" disabled={isSimulating}>
          {#if isSimulating}
            <svg
              class="mr-1 -ml-1 inline-block h-4 w-4 animate-spin text-white"
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
          {t("shipping_rules.calculate")}
        </Button>
        {#if simulateMessage}
          <div
            class="flex w-full flex-1 items-center rounded-xl border-none bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300"
            transition:fade={{ duration: 200 }}
          >
            <span class="mr-3 text-lg">{simulateMessage.includes(t("common.error")) ? "❌" : "✅"}</span>
            <span class="font-mono leading-relaxed opacity-90">{simulateMessage}</span>
          </div>
        {/if}
      </div>
    </CrudInlineForm>
  </div>
</div>

<div class="mt-2">
  <Table
    headers={[
      t("common.name"),
      t("shipping_rules.type"),
      t("shipping_rules.priority"),
      t("shipping_rules.config"),
      t("common.status"),
      t("common.actions"),
    ]}
  >
    {#if currentRules.length === 0}
      <TableRow>
        <TableCell colspan={6} class="py-12 text-center text-sm text-stone-400 italic"
          >{t("shipping_rules.empty")}</TableCell
        >
      </TableRow>
    {/if}
    {#each currentRules as row (row.id)}
      <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
        <TableCell class="py-4">
          <div
            contenteditable="true"
            data-field="name"
            class="rounded-lg border border-transparent px-3 py-1.5 font-bold text-stone-900 transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
          >
            {row.name}
          </div>
        </TableCell>
        <TableCell class="py-4">
          <select
            data-field="type"
            class="cursor-pointer rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-xs font-bold uppercase transition-all outline-none hover:bg-white focus:bg-white"
          >
            <option value="flat" selected={row.type === "flat"}>💵 {t("shipping_rules.types.flat")}</option>
            <option value="free_threshold" selected={row.type === "free_threshold"}
              >🛒 {t("shipping_rules.types.free_threshold")}</option
            >
            <option value="zone" selected={row.type === "zone"}>🗺️ {t("shipping_rules.types.zone")}</option>
          </select>
        </TableCell>
        <TableCell class="py-4">
          <div
            contenteditable="true"
            data-field="priority"
            class="rounded-lg px-3 py-1.5 text-center font-bold text-stone-600 tabular-nums transition-all outline-none hover:bg-white focus:bg-white"
          >
            {row.priority}
          </div>
        </TableCell>
        <TableCell class="py-4">
          <textarea
            data-field="config"
            rows="2"
            class="w-full resize-none rounded-lg border-transparent bg-transparent px-3 py-1.5 font-mono text-[10px] transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
            >{row.configJson}</textarea
          >
        </TableCell>
        <TableCell class="py-4 text-center">
          <select
            data-field="isActive"
            class="cursor-pointer rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-xs font-bold transition-all outline-none hover:bg-white focus:bg-white"
          >
            <option value="true" selected={!!row.isActive}>🟢 {t("common.active_status").toUpperCase()}</option>
            <option value="false" selected={!row.isActive}>🔴 {t("common.inactive_status").toUpperCase()}</option>
          </select>
        </TableCell>
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
</div>
<ToastNotification bind:this={toastRef} />
