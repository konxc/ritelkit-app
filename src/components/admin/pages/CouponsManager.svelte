<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { trpc } from "../../../lib/trpc";
  import {
    fade,
    fly,
  } from "svelte/transition";
  import {
    createQuery,
    createMutation,
    useQueryClient,
  } from "@tanstack/svelte-query";

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
      toastRef?.show("Kupon berhasil ditambahkan!", "success");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Gagal menambah kupon";
      toastRef?.show(message, "error");
    },
  }));

  const updateCouponMutation = createMutation(() => ({
    mutationFn: (payload: { id: string; data: any }) =>
      trpc.coupons.update.mutate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toastRef?.show("Kupon diperbarui", "success");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Gagal memperbarui kupon";
      toastRef?.show(message, "error");
    },
  }));

  const deleteCouponMutation = createMutation(() => ({
    mutationFn: (id: string) => trpc.coupons.delete.mutate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toastRef?.show("Kupon dihapus", "success");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Gagal menghapus kupon";
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
      maxDiscount: data.get("max_discount")
        ? Number(data.get("max_discount"))
        : null,
      startAt: (data.get("start_at") as string) || null,
      endAt: (data.get("end_at") as string) || null,
      usageLimit: data.get("usage_limit")
        ? Number(data.get("usage_limit"))
        : null,
      perUserLimit: data.get("per_user_limit")
        ? Number(data.get("per_user_limit"))
        : 1,
      isActive: data.get("is_active") === "true" ? 1 : 0,
    });
    form.reset();
  };

  const handleRowAction = (
    id: string,
    action: string,
    rowElement: HTMLElement | null,
  ) => {
    if (action === "delete") {
      if (confirm("Hapus kupon ini?")) {
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
        minOrder:
          fields.min_order === "∞" || !fields.min_order
            ? null
            : Number(fields.min_order),
        maxDiscount:
          fields.max_discount === "∞" || !fields.max_discount
            ? null
            : Number(fields.max_discount),
        startAt:
          fields.start_at === "-" || !fields.start_at ? null : fields.start_at,
        endAt: fields.end_at === "-" || !fields.end_at ? null : fields.end_at,
        usageLimit:
          fields.usage_limit === "∞" || !fields.usage_limit
            ? null
            : Number(fields.usage_limit),
        perUserLimit: fields.per_user_limit ? Number(fields.per_user_limit) : 1,
        isActive: fields.is_active === "true" ? 1 : 0,
      };

      updateCouponMutation.mutate({ id, data });
    }
  };

  let currentCoupons = $derived((couponsQuery.data as Coupon[]) || initialRows);
</script>
<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
<SectionHeader title="Tambah Kupon" muted="Promo & diskon" />
<CrudInlineForm
  id="coupon-form"
  on:submit={handleCreate}
  isSubmitting={createCouponMutation.isPending}
>
  <div class="space-y-6 border-b border-stone-100 pb-8 mb-8">
    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
    >
      <div class="space-y-1.5">
        <label
          for="code"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Kode Kupon</label
        >
        <input
          id="code"
          name="code"
          required
          placeholder="Cth: UNTUNG10"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold tracking-widest uppercase"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="type"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Tipe Diskon</label
        >
        <select
          id="type"
          name="type"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none appearance-none cursor-pointer font-medium"
        >
          <option value="percent">Persentase (%)</option>
          <option value="fixed">Nominal Tetap (Rp)</option>
          <option value="free_shipping">Gratis Ongkir</option>
        </select>
      </div>
      <div class="space-y-1.5">
        <label
          for="value"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Nilai Diskon</label
        >
        <input
          id="value"
          name="value"
          type="number"
          required
          placeholder="0"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="min_order"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Minimal Order</label
        >
        <input
          id="min_order"
          name="min_order"
          type="number"
          placeholder="0"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="max_discount"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Maks. Diskon</label
        >
        <input
          id="max_discount"
          name="max_discount"
          type="number"
          placeholder="Tanpa batas"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="start_at"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Tanggal Mulai</label
        >
        <input
          id="start_at"
          name="start_at"
          type="date"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="end_at"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Tanggal Berakhir</label
        >
        <input
          id="end_at"
          name="end_at"
          type="date"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="usage_limit"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Kuota Total</label
        >
        <input
          id="usage_limit"
          name="usage_limit"
          type="number"
          placeholder="0"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none uppercase"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="per_user_limit"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Kuota / User</label
        >
        <input
          id="per_user_limit"
          name="per_user_limit"
          type="number"
          placeholder="1"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none uppercase"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="is_active"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Status</label
        >
        <select
          id="is_active"
          name="is_active"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none appearance-none cursor-pointer font-medium"
        >
          <option value="true">Aktif</option>
          <option value="false">Tidak Aktif</option>
        </select>
      </div>
    </div>
  </div>
  <div class="flex items-end mt-4">
    <button
      class="flex items-center justify-center gap-3 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto mt-auto"
      type="submit"
      disabled={createCouponMutation.isPending}
    >
      {#if createCouponMutation.isPending}
        <svg
          class="animate-spin -ml-1 mr-1 h-4 w-4 text-white inline-block"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          ><circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle><path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path></svg
        >
      {/if}
      Tambah Kupon
    </button>
  </div>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Kupon" muted="Klik sel untuk edit" />
</div>

<AdminDataTable>
  <thead>
    <tr>
      <th>Kode</th>
      <th>Tipe</th>
      <th>Nilai</th>
      <th>Min Order</th>
      <th>Max Diskon</th>
      <th>Mulai</th>
      <th>Berakhir</th>
      <th>Limit</th>
      <th>Per User</th>
      <th>Status</th>
      <th>Aksi</th>
    </tr>
  </thead>
  <tbody>
    {#if currentCoupons.length === 0}
      <tr>
        <td colspan="11" class="text-center py-12 text-stone-400 text-sm italic"
          >Belum ada kupon aktif.</td
        >
      </tr>
    {/if}
    {#each currentCoupons as row (row.id)}
      <tr
        transition:fade={{ duration: 200 }}
        class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0 text-xs"
      >
        <td
          contenteditable="true"
          data-field="code"
          class="py-4 font-bold text-stone-900 tracking-widest uppercase outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-2 py-1.5 rounded-lg border border-transparent transition-all"
          >{row.code}</td
        >
        <td class="py-4">
          <select
            data-field="type"
            class="px-2 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white transition-all bg-transparent text-[10px] font-bold uppercase cursor-pointer outline-none"
          >
            <option value="percent" selected={row.type === "percent"}
              >% Percent</option
            >
            <option value="fixed" selected={row.type === "fixed"}
              >Rp Fixed</option
            >
            <option
              value="free_shipping"
              selected={row.type === "free_shipping"}>🚚 Free Ship</option
            >
          </select>
        </td>
        <td
          contenteditable="true"
          data-field="value"
          class="py-4 tabular-nums font-bold text-stone-800 outline-none hover:bg-white focus:bg-white px-2 py-1.5 rounded-lg transition-all"
          >{row.value}</td
        >
        <td
          contenteditable="true"
          data-field="min_order"
          class="py-4 tabular-nums text-stone-500 outline-none hover:bg-white focus:bg-white px-2 py-1.5 rounded-lg transition-all"
          >{row.minOrder ?? "0"}</td
        >
        <td
          contenteditable="true"
          data-field="max_discount"
          class="py-4 tabular-nums text-stone-500 outline-none hover:bg-white focus:bg-white px-2 py-1.5 rounded-lg transition-all"
          >{row.maxDiscount ?? "∞"}</td
        >
        <td
          contenteditable="true"
          data-field="start_at"
          class="py-4 font-mono text-stone-400 outline-none hover:bg-white focus:bg-white px-2 py-1.5 rounded-lg transition-all"
          >{row.startAt ?? "-"}</td
        >
        <td
          contenteditable="true"
          data-field="end_at"
          class="py-4 font-mono text-stone-400 outline-none hover:bg-white focus:bg-white px-2 py-1.5 rounded-lg transition-all"
          >{row.endAt ?? "-"}</td
        >
        <td
          contenteditable="true"
          data-field="usage_limit"
          class="py-4 tabular-nums text-stone-700 font-medium outline-none hover:bg-white focus:bg-white px-2 py-1.5 rounded-lg transition-all"
          >{row.usageLimit ?? "∞"}</td
        >
        <td
          contenteditable="true"
          data-field="per_user_limit"
          class="py-4 tabular-nums text-stone-700 font-medium outline-none hover:bg-white focus:bg-white px-2 py-1.5 rounded-lg transition-all"
          >{row.perUserLimit ?? "1"}</td
        >
        <td class="py-4 text-center">
          <select
            data-field="is_active"
            class="px-2 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white transition-all bg-transparent font-bold cursor-pointer outline-none"
          >
            <option value="true" selected={row.isActive === 1}>ON</option>
            <option value="false" selected={row.isActive === 0}>OFF</option>
          </select>
        </td>
        <td class="py-4">
          <RowActions
            isSaving={updateCouponMutation.isPending &&
              updateCouponMutation.variables?.id === row.id}
            isDeleting={deleteCouponMutation.isPending &&
              deleteCouponMutation.variables === row.id}
            onSave={(e) =>
              handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
            onDelete={() => handleRowAction(row.id, "delete", null)}
          />
        </td>
      </tr>
    {/each}
  </tbody>
</AdminDataTable>
</div>

<ToastNotification bind:this={toastRef} />
