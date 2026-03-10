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
  import { trpc } from "../../../lib/trpc";
  import { fade, fly } from "svelte/transition";
  import { createQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { onMount } from "svelte";
  import { t, initI18n } from "../../../lib/i18n/store.svelte";

  import type { Coupon } from "../../../lib/types";

  let { rows: initialRows = [] }: { rows: Coupon[] } = $props();

  const queryClient = useQueryClient();
  let toastRef = $state<ToastNotification>();

  const couponsQuery = createQuery(() => ({
    queryKey: ["coupons"],
    queryFn: () => trpc.coupons.list.query(),
    initialData: initialRows.length > 0 ? initialRows : undefined,
  }));

  const createCouponMutation = createMutation(() => ({
    mutationFn: (data: any) => trpc.coupons.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toastRef?.show(t("coupons.toast_add"), "success");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to add coupon";
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
      const message = err instanceof Error ? err.message : "Failed to update coupon";
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
      const message = err instanceof Error ? err.message : "Failed to delete coupon";
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
    form.reset();
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

  let currentCoupons = $derived((couponsQuery.data as Coupon[]) || initialRows);
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <SectionHeader title={t("coupons.title_add")} muted={t("coupons.muted_add")} />
    <CrudInlineForm id="coupon-form" on:submit={handleCreate} isSubmitting={createCouponMutation.isPending}>
      <div class="mb-8 space-y-6 border-b border-stone-100 pb-8">
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <div>
            <TextInput
              id="code"
              name="code"
              label={t("coupons.code")}
              required
              placeholder={t("coupons.code_placeholder")}
              class="font-bold tracking-widest uppercase"
            />
          </div>
          <div>
            <SelectInput
              id="type"
              name="type"
              label={t("coupons.type")}
              options={[
                { label: t("coupons.type_percent"), value: "percent" },
                { label: t("coupons.type_fixed"), value: "fixed" },
                { label: t("coupons.type_free_shipping"), value: "free_shipping" },
              ]}
            />
          </div>
          <div>
            <TextInput
              id="value"
              name="value"
              type="number"
              label={t("coupons.value")}
              required
              placeholder="0"
              class="font-bold"
            />
          </div>
          <div>
            <TextInput id="min_order" name="min_order" type="number" label={t("coupons.min_order")} placeholder="0" />
          </div>
          <div>
            <TextInput
              id="max_discount"
              name="max_discount"
              type="number"
              label={t("coupons.max_discount")}
              placeholder={t("coupons.max_discount_no_limit")}
            />
          </div>
          <div>
            <TextInput id="start_at" name="start_at" type="date" label={t("coupons.start_date")} />
          </div>
          <div>
            <TextInput id="end_at" name="end_at" type="date" label={t("coupons.end_date")} />
          </div>
          <div>
            <TextInput
              id="usage_limit"
              name="usage_limit"
              type="number"
              label={t("coupons.total_quota")}
              placeholder="0"
              class="uppercase"
            />
          </div>
          <div>
            <TextInput
              id="per_user_limit"
              name="per_user_limit"
              type="number"
              label={t("coupons.per_user_quota")}
              placeholder="1"
              class="uppercase"
            />
          </div>
          <div>
            <SelectInput
              id="is_active"
              name="is_active"
              label={t("coupons.status")}
              options={[
                { label: t("coupons.active"), value: "true" },
                { label: t("coupons.inactive"), value: "false" },
              ]}
            />
          </div>
        </div>
      </div>
      <div class="mt-4 flex items-end">
        <Button
          type="submit"
          variant="primary"
          class="mt-auto h-[42px] w-full px-8 md:w-auto"
          disabled={createCouponMutation.isPending}
        >
          {#if createCouponMutation.isPending}
            <svg
              class="mr-2 -ml-1 inline-block h-4 w-4 animate-spin text-white"
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
          {t("coupons.add_coupon")}
        </Button>
      </div>
    </CrudInlineForm>

    <div class="mt-6">
      <SectionHeader title={t("coupons.title_list")} muted={t("coupons.muted_list")} />
    </div>

    <Table
      headers={[
        t("coupons.code"),
        t("coupons.type"),
        t("coupons.value"),
        t("coupons.min_order"),
        t("coupons.max_discount"),
        t("coupons.start_date"),
        t("coupons.end_date"),
        t("common.limit"),
        t("coupons.per_user_quota"),
        t("coupons.status"),
        t("common.actions"),
      ]}
    >
      {#if currentCoupons.length === 0}
        <TableRow>
          <TableCell colspan={11} class="py-12 text-center text-sm text-stone-400 italic"
            >{t("coupons.empty")}</TableCell
          >
        </TableRow>
      {/if}
      {#each currentCoupons as row (row.id)}
        <TableRow class="group border-b border-stone-100 text-xs transition-colors last:border-0 hover:bg-stone-50/50">
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="code"
              class="rounded-lg border border-transparent px-2 py-1.5 font-bold tracking-widest text-stone-900 uppercase transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
            >
              {row.code}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <select
              data-field="type"
              class="cursor-pointer rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-[10px] font-bold uppercase transition-all outline-none hover:bg-white focus:bg-white"
            >
              <option value="percent" selected={row.type === "percent"}>{t("coupons.type_percent")}</option>
              <option value="fixed" selected={row.type === "fixed"}>{t("coupons.type_fixed")}</option>
              <option value="free_shipping" selected={row.type === "free_shipping"}
                >🚚 {t("coupons.type_free_shipping")}</option
              >
            </select>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="value"
              class="rounded-lg px-2 py-1.5 font-bold text-stone-800 tabular-nums transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.value}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="min_order"
              class="rounded-lg px-2 py-1.5 text-stone-500 tabular-nums transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.minOrder ?? "0"}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="max_discount"
              class="rounded-lg px-2 py-1.5 text-stone-500 tabular-nums transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.maxDiscount ?? t("coupons.unlimited")}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="start_at"
              class="rounded-lg px-2 py-1.5 font-mono text-stone-400 transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.startAt ?? "-"}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="end_at"
              class="rounded-lg px-2 py-1.5 font-mono text-stone-400 transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.endAt ?? "-"}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="usage_limit"
              class="rounded-lg px-2 py-1.5 font-medium text-stone-700 tabular-nums transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.usageLimit ?? t("coupons.unlimited")}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="per_user_limit"
              class="rounded-lg px-2 py-1.5 font-medium text-stone-700 tabular-nums transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.perUserLimit ?? "1"}
            </div>
          </TableCell>
          <TableCell class="py-4 text-center">
            <select
              data-field="is_active"
              class="cursor-pointer rounded-lg border border-transparent bg-transparent px-2 py-1.5 font-bold transition-all outline-none hover:bg-white focus:bg-white"
            >
              <option value="true" selected={row.isActive === 1}>{t("coupons.active").toUpperCase()}</option>
              <option value="false" selected={row.isActive === 0}>{t("coupons.inactive").toUpperCase()}</option>
            </select>
          </TableCell>
          <TableCell class="py-4">
            <RowActions
              isSaving={updateCouponMutation.isPending && updateCouponMutation.variables?.id === row.id}
              isDeleting={deleteCouponMutation.isPending && deleteCouponMutation.variables === row.id}
              onSave={(e) => handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
              onDelete={() => handleRowAction(row.id, "delete", null)}
            />
          </TableCell>
        </TableRow>
      {/each}
    </Table>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
