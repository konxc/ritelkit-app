<script module lang="ts">
  import type { Coupon } from "../../../lib/types";
  export type CouponRow = Coupon;
</script>

<script lang="ts">
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
  import { trpc } from "../../../lib/trpc";
  import { fade, fly } from "svelte/transition";
  import { createQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { onMount, untrack } from "svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";

  let {
    rows: initialRows = [],
    total: initialTotal = 0,
    q = "",
    status = "",
    page = 1,
    limit = 20,
    lang,
  }: {
    rows: CouponRow[];
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
  let isDrawerOpen = $state(false);

  let columns = $state([
    { id: "code", label: t("coupons.code"), isVisible: true, class: "font-bold tracking-widest text-stone-900 uppercase" },
    { id: "type", label: t("coupons.type"), isVisible: true, class: "" },
    { id: "value", label: t("coupons.value"), isVisible: true, class: "font-bold text-stone-800 tabular-nums" },
    { id: "min_order", label: t("coupons.min_order"), isVisible: true, class: "text-stone-500 tabular-nums" },
    { id: "max_discount", label: t("coupons.max_discount"), isVisible: false, class: "text-stone-500 tabular-nums" },
    { id: "start_date", label: t("coupons.start_date"), isVisible: false, class: "font-mono text-stone-400" },
    { id: "end_date", label: t("coupons.end_date"), isVisible: true, class: "font-mono text-stone-400" },
    { id: "limit", label: t("common.limit"), isVisible: true, class: "font-medium text-stone-700 tabular-nums" },
    { id: "status", label: t("coupons.status"), isVisible: true, class: "" },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);

  const offset = $derived((page - 1) * limit);

  const couponsQuery = createQuery(() => ({
    queryKey: ["coupons", { q, status, limit, offset }],
    queryFn: () => trpc.coupons.list.query({ q, status, limit, offset }),
    initialData: initialRows?.length > 0 ? { data: initialRows, total: initialTotal } : undefined,
  }));

  let rows = $derived(couponsQuery.data?.data || initialRows || []);
  let total = $derived(couponsQuery.data?.total || initialTotal || 0);

  const createCouponMutation = createMutation(() => ({
    mutationFn: (data: any) => trpc.coupons.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toastRef?.show(t("coupons.toast_add"), "success");
      isDrawerOpen = false;
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : t("common.error_occurred");
      toastRef?.show(message, "error");
    },
  }));

  const updateCouponMutation = createMutation(() => ({
    mutationFn: (payload: { id: string; data: any }) => trpc.coupons.update.mutate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toastRef?.show(t("coupons.toast_update"), "success");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : t("common.error_occurred");
      toastRef?.show(message, "error");
    },
  }));

  const deleteCouponMutation = createMutation(() => ({
    mutationFn: (id: string) => trpc.coupons.delete.mutate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toastRef?.show(t("coupons.toast_delete"), "success");
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

    createCouponMutation.mutate({
      code: data.get("code") as string,
      type: data.get("type") as string,
      value: Number(data.get("value")),
      minOrder: data.get("min_order") ? Number(data.get("min_order")) : null,
      maxDiscount: data.get("max_discount") ? Number(data.get("max_discount")) : null,
      startAt: (data.get("start_at") as string) || null,
      endAt: (data.get("end_at") as string) || null,
      usageLimit: data.get("usage_limit") ? Number(data.get("usage_limit")) : null,
      perUserLimit: data.get("per_user_limit") ? Number(data.get("per_user_limit")) : 1,
      isActive: data.get("is_active") === "true" ? 1 : 0,
    });
  };

  const handleRowAction = (id: string, action: string, rowElement: HTMLElement | null) => {
    if (action === "delete") {
      if (confirm(t("coupons.confirm_delete"))) {
        deleteCouponMutation.mutate(id);
      }
    } else if (action === "save" && rowElement) {
      const fields: Record<string, string> = {};
      rowElement.querySelectorAll("[data-field]").forEach((el) => {
        const field = el.getAttribute("data-field")!;
        if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
          fields[field] = el.value;
        } else {
          fields[field] = el.textContent?.trim();
        }
      });

      const data = {
        code: fields.code,
        type: fields.type,
        value: Number(fields.value),
        minOrder: fields.min_order === t("coupons.unlimited") || !fields.min_order ? null : Number(fields.min_order),
        maxDiscount:
          fields.max_discount === t("coupons.unlimited") || !fields.max_discount ? null : Number(fields.max_discount),
        startAt: fields.start_at === "-" || !fields.start_at ? null : fields.start_at,
        endAt: fields.end_at === "-" || !fields.end_at ? null : fields.end_at,
        usageLimit:
          fields.usage_limit === t("coupons.unlimited") || !fields.usage_limit ? null : Number(fields.usage_limit),
        perUserLimit: fields.per_user_limit ? Number(fields.per_user_limit) : 1,
        isActive: fields.is_active === "true" ? 1 : 0,
      };

      updateCouponMutation.mutate({ id, data });
    }
  };

  const syncFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    q = params.get("q") || "";
    status = params.get("status") || "";
    page = Number(params.get("page")) || 1;
  };

  onMount(() => {
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  });

</script>

{#snippet couponIcon()}
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
    ><path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/><path d="M21 12H3"/><path d="M21 16v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2"/><rect width="18" height="8" x="3" y="8" rx="2"/></svg>
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
      form="coupon-form"
      variant="primary"
      class="relative flex h-11 flex-[2] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#c48a3a] px-8 py-0 font-black text-white shadow-[0_10px_30px_-10px_rgba(196,138,58,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_35px_-10px_rgba(196,138,58,0.6)] active:scale-[0.98] lg:h-[52px]"
      disabled={createCouponMutation.isPending}
    >
      {#if createCouponMutation.isPending}
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
            ><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
          <span class="text-[0.75rem] tracking-tight uppercase">{t("coupons.add_coupon")}</span>
        </div>
      {/if}
    </Button>
  </div>
{/snippet}

<div class="h-full w-full text-xs">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("coupons.title_list")} muted={t("coupons.muted_list")} />
      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <div class="mr-2">
          <AdminHeaderFilters tab="coupons" {q} {status} {columns} />
        </div>

        <ColumnVisibilityToggle bind:columns />

        <div class="h-10 w-px bg-stone-200/80"></div>

        <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex items-center gap-2">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              ><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
            {t("coupons.add_coupon")}
          </div>
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("coupons.add_coupon")} />

    <Drawer
      bind:isOpen={isDrawerOpen}
      title={t("coupons.title_add")}
      subtitle={t("coupons.muted_add")}
      icon={couponIcon}
      footer={drawerFooter}
      maxWidth="lg"
    >
      <div class="flex h-full flex-col px-5 py-6 lg:px-7 lg:py-8">
        <CrudInlineForm id="coupon-form" onsubmit={handleCreate} isSubmitting={createCouponMutation.isPending}>
          <div class="space-y-8">
            <div class="space-y-6">
              <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
                {t("coupons.basic_info")}
              </h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2 space-y-1.5">
                   <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M2 9V5.25A2.25 2.25 0 0 1 4.25 3H19.75A2.25 2.25 0 0 1 22 5.25V9"/><path d="M22 15v3.75A2.25 2.25 0 0 1 19.75 21H4.25A2.25 2.25 0 0 1 2 18.75V15"/><rect width="20" height="6" x="2" y="9" rx="2"/></svg>
                    <label for="code" class="text-[0.8rem] font-bold text-stone-600">{t("coupons.code")}</label>
                  </div>
                  <TextInput id="code" name="code" required placeholder={t("coupons.code_placeholder")} class="font-bold tracking-widest uppercase ring-stone-100/50" />
                </div>
                <div class="space-y-1.5 text-left">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><circle cx="12" cy="12" r="10"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                    <label for="type" class="text-[0.8rem] font-bold text-stone-600">{t("coupons.type")}</label>
                  </div>
                  <SelectInput
                    id="type"
                    name="type"
                    options={[
                      { label: t("coupons.type_percent"), value: "percent" },
                      { label: t("coupons.type_fixed"), value: "fixed" },
                      { label: t("coupons.type_free_shipping"), value: "free_shipping" },
                    ]}
                  />
                </div>
                <div class="space-y-1.5 text-left">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <label for="value" class="text-[0.8rem] font-bold text-stone-600">{t("coupons.value")}</label>
                  </div>
                  <TextInput id="value" name="value" type="number" required placeholder="0" class="font-bold ring-stone-100/50" />
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <h4 class="border-b border-[#c48a3a]/20 pb-2 text-xs font-bold tracking-widest text-[#c48a3a] uppercase">
                {t("coupons.limitations") || "Batasan & Kuota"}
              </h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5 text-left">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    <label for="min_order" class="text-[0.8rem] font-bold text-stone-600">{t("coupons.min_order")}</label>
                  </div>
                  <TextInput id="min_order" name="min_order" type="number" placeholder="0" class="ring-stone-100/50" />
                </div>
                <div class="space-y-1.5 text-left">
                   <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
                    <label for="max_discount" class="text-[0.8rem] font-bold text-stone-600">{t("coupons.max_discount")}</label>
                  </div>
                  <TextInput id="max_discount" name="max_discount" type="number" placeholder={t("coupons.max_discount_no_limit")} class="ring-stone-100/50" />
                </div>
                <div class="space-y-1.5 text-left">
                   <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <label for="usage_limit" class="text-[0.8rem] font-bold text-stone-600">{t("coupons.total_quota")}</label>
                  </div>
                  <TextInput id="usage_limit" name="usage_limit" type="number" placeholder="0" class="uppercase ring-stone-100/50" />
                </div>
                <div class="space-y-1.5 text-left">
                   <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <label for="per_user_limit" class="text-[0.8rem] font-bold text-stone-600">{t("coupons.per_user_quota")}</label>
                  </div>
                  <TextInput id="per_user_limit" name="per_user_limit" type="number" placeholder="1" class="uppercase ring-stone-100/50" />
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
                    <label for="start_at" class="text-[0.8rem] font-bold text-stone-600">{t("coupons.start_date")}</label>
                  </div>
                  <TextInput id="start_at" name="start_at" type="date" class="ring-stone-100/50" />
                </div>
                <div class="space-y-1.5 text-left">
                  <div class="mb-1 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    <label for="end_at" class="text-[0.8rem] font-bold text-stone-600">{t("coupons.end_date")}</label>
                  </div>
                  <TextInput id="end_at" name="end_at" type="date" class="ring-stone-100/50" />
                </div>
                <div class="col-span-2 space-y-1.5 text-left">
                  <label for="is_active" class="text-[0.8rem] font-bold text-stone-600">{t("coupons.status")}</label>
                  <SelectInput
                    id="is_active"
                    name="is_active"
                    options={[
                      { label: t("coupons.active"), value: "true" },
                      { label: t("coupons.inactive"), value: "false" },
                    ]}
                  />
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-[#c48a3a]/10 bg-[#c48a3a]/5 p-5 text-[#865d25]">
              <div class="flex gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mt-1 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <div>
                  <h4 class="text-[0.75rem] font-black tracking-wider uppercase">{t("catalog.categories.tips_title")}</h4>
                  <p class="mt-1 text-[0.8rem] leading-relaxed font-medium">
                    {t("coupons.tips_coupon_create") || "Gunakan kode yang mudah diingat dan tentukan batasan kuota untuk mencegah kerugian berlebih."}
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
          title={t("coupons.empty_title") || t("coupons.empty")}
          subtitle={t("coupons.empty_description") || ""}
          colspan={activeHeaders.length}
        />
      {/if}

      {#each rows as row (row.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          {#if columns[0].isVisible}
          <TableCell class="py-4">
            <InlineEditableField
              value={row.code}
              field="code"
              ariaLabel={t("coupons.code")}
              class="font-bold tracking-widest text-stone-900 uppercase"
            />
          </TableCell>
          {/if}

          {#if columns[1].isVisible}
          <TableCell class="py-4">
            <select
              data-field="type"
              class="cursor-pointer rounded-lg border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 text-[0.7rem] font-bold tracking-wider text-stone-700 uppercase transition-all outline-none hover:border-[#c48a3a]/30 hover:bg-white focus:bg-white"
            >
              <option value="percent" selected={row.type === "percent"}>{t("coupons.type_percent")}</option>
              <option value="fixed" selected={row.type === "fixed"}>{t("coupons.type_fixed")}</option>
              <option value="free_shipping" selected={row.type === "free_shipping"}>🚚 {t("coupons.type_free_shipping")}</option>
            </select>
          </TableCell>
          {/if}

          {#if columns[2].isVisible}
          <TableCell class="py-4">
             <InlineEditableField
              value={row.value}
              field="value"
              type="number"
              ariaLabel={t("coupons.value")}
              class="font-bold text-stone-800 tabular-nums"
            />
          </TableCell>
          {/if}

          {#if columns[3].isVisible}
          <TableCell class="py-4">
            <InlineEditableField
              value={row.minOrder ?? "0"}
              field="min_order"
              type="number"
              ariaLabel={t("coupons.min_order")}
              class="text-stone-500 tabular-nums"
            />
          </TableCell>
          {/if}

          {#if columns[4].isVisible}
          <TableCell class="py-4">
             <InlineEditableField
              value={row.maxDiscount ?? t("coupons.unlimited")}
              field="max_discount"
              ariaLabel={t("coupons.max_discount")}
              class="text-stone-500 tabular-nums"
            />
          </TableCell>
          {/if}

          {#if columns[5].isVisible}
          <TableCell class="py-4">
             <InlineEditableField
              value={row.startAt ?? "-"}
              field="start_at"
              ariaLabel={t("coupons.start_date")}
              class="font-mono text-stone-400"
            />
          </TableCell>
          {/if}

          {#if columns[6].isVisible}
          <TableCell class="py-4">
             <InlineEditableField
              value={row.endAt ?? "-"}
              field="end_at"
              ariaLabel={t("coupons.end_date")}
              class="font-mono text-stone-400"
            />
          </TableCell>
          {/if}

          {#if columns[7].isVisible}
          <TableCell class="py-4">
             <InlineEditableField
              value={row.usageLimit ?? t("coupons.unlimited")}
              field="usage_limit"
              ariaLabel={t("common.limit")}
              class="font-medium text-stone-700 tabular-nums"
            />
          </TableCell>
          {/if}

          {#if columns[8].isVisible}
          <TableCell class="py-4 text-center">
            <select
              data-field="is_active"
              class="cursor-pointer rounded-lg border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 text-[0.7rem] font-bold tracking-wider text-stone-700 uppercase transition-all outline-none hover:border-[#c48a3a]/30 hover:bg-white focus:bg-white"
            >
              <option value="true" selected={row.isActive === 1}>{t("coupons.active").toUpperCase()}</option>
              <option value="false" selected={row.isActive === 0}>{t("coupons.inactive").toUpperCase()}</option>
            </select>
          </TableCell>
          {/if}

          <TableCell class="py-4 pr-4 text-right">
            <RowActions
              isSaving={updateCouponMutation.isPending && updateCouponMutation.variables?.id === row.id}
              isDeleting={deleteCouponMutation.isPending && deleteCouponMutation.variables === row.id}
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
