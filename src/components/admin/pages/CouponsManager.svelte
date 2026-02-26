<script module lang="ts">
  export type CouponRow = {
    id: string | number;
    code: string;
    type: string;
    value: number;
    min_order: number | null;
    max_discount: number | null;
    start_at: string | null;
    end_at: string | null;
    usage_limit: number | null;
    per_user_limit: number | null;
    is_active: boolean;
  };
</script>

<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { onMount } from "svelte";

  // ... coupon row definition ...

  let { rows = [] }: { rows: CouponRow[] } = $props();

  let csrfToken = "";
  let isSubmitting = $state(false);
  let rowStates = $state<
    Record<string, { isSaving?: boolean; isDeleting?: boolean }>
  >({});
  let toastRef: ToastNotification;

  onMount(() => {
    csrfToken =
      document
        .querySelector("meta[name='csrf-token']")
        ?.getAttribute("content") || "";
  });

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;

    isSubmitting = true;
    try {
      const data = new FormData(form);
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
        body: data,
      });
      if (!response.ok) {
        toastRef?.show(await response.text(), "error");
        return;
      }
      toastRef?.show("Kupon berhasil ditambahkan!", "success");
      setTimeout(() => location.reload(), 800);
    } catch (err: any) {
      toastRef?.show(err.message || "Kesalahan jaringan", "error");
    } finally {
      isSubmitting = false;
    }
  };

  const handleRowAction = async (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    if (!action) return;
    const row = target.closest("tr[data-id]");
    if (!row) return;
    const id = row.getAttribute("data-id");
    if (!id) return;

    if (action === "delete") {
      if (!confirm("Hapus kupon ini?")) return;

      rowStates[id] = { ...rowStates[id], isDeleting: true };

      try {
        const response = await fetch(`/api/admin/coupons/${id}`, {
          method: "DELETE",
          headers: { "X-CSRF-Token": csrfToken },
        });
        if (!response.ok) {
          toastRef?.show(await response.text(), "error");
          rowStates[id] = { ...rowStates[id], isDeleting: false };
          return;
        }
        toastRef?.show("Kupon dihapus", "success");
        setTimeout(() => location.reload(), 800);
      } catch (err: any) {
        toastRef?.show(err.message || "Kesalahan jaringan", "error");
        rowStates[id] = { ...rowStates[id], isDeleting: false };
      }
      return;
    }

    if (action === "save") {
      rowStates[id] = { ...rowStates[id], isSaving: true };

      try {
        const fields: Record<string, string> = {};
        row.querySelectorAll("[data-field]").forEach((cell) => {
          const field = cell.getAttribute("data-field");
          if (!field) return;
          if (
            cell instanceof HTMLSelectElement ||
            cell instanceof HTMLInputElement
          ) {
            fields[field] = String(cell.value);
            return;
          }
          fields[field] = String(cell.textContent?.trim() || "");
        });
        const payload = {
          ...fields,
        };
        const response = await fetch(`/api/admin/coupons/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          toastRef?.show(await response.text(), "error");
          rowStates[id] = { ...rowStates[id], isSaving: false };
          return;
        }
        toastRef?.show("Kupon diperbarui", "success");
        setTimeout(() => location.reload(), 800);
      } catch (err: any) {
        toastRef?.show(err.message || "Kesalahan perbaruan", "error");
        rowStates[id] = { ...rowStates[id], isSaving: false };
      }
    }
  };
</script>

<SectionHeader title="Tambah Kupon" muted="Promo & diskon" />
<CrudInlineForm id="coupon-form" on:submit={handleCreate} {isSubmitting}>
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
      disabled={isSubmitting}
    >
      {#if isSubmitting}
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
<div
  role="button"
  tabindex="0"
  onclick={handleRowAction}
  onkeydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  }}
>
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
      {#if rows.length === 0}
        <tr>
          <td
            colspan="11"
            class="text-center py-12 text-stone-400 text-sm italic"
            >Belum ada kupon aktif.</td
          >
        </tr>
      {/if}
      {#each rows as row (row.id)}
        <tr
          data-id={row.id}
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
            >{row.min_order ?? "0"}</td
          >
          <td
            contenteditable="true"
            data-field="max_discount"
            class="py-4 tabular-nums text-stone-500 outline-none hover:bg-white focus:bg-white px-2 py-1.5 rounded-lg transition-all"
            >{row.max_discount ?? "∞"}</td
          >
          <td
            contenteditable="true"
            data-field="start_at"
            class="py-4 font-mono text-stone-400 outline-none hover:bg-white focus:bg-white px-2 py-1.5 rounded-lg transition-all"
            >{row.start_at ?? "-"}</td
          >
          <td
            contenteditable="true"
            data-field="end_at"
            class="py-4 font-mono text-stone-400 outline-none hover:bg-white focus:bg-white px-2 py-1.5 rounded-lg transition-all"
            >{row.end_at ?? "-"}</td
          >
          <td
            contenteditable="true"
            data-field="usage_limit"
            class="py-4 tabular-nums text-stone-700 font-medium outline-none hover:bg-white focus:bg-white px-2 py-1.5 rounded-lg transition-all"
            >{row.usage_limit ?? "∞"}</td
          >
          <td
            contenteditable="true"
            data-field="per_user_limit"
            class="py-4 tabular-nums text-stone-700 font-medium outline-none hover:bg-white focus:bg-white px-2 py-1.5 rounded-lg transition-all"
            >{row.per_user_limit ?? "1"}</td
          >
          <td class="py-4 text-center">
            <select
              data-field="is_active"
              class="px-2 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white transition-all bg-transparent font-bold cursor-pointer outline-none"
            >
              <option value="true" selected={row.is_active}>ON</option>
              <option value="false" selected={!row.is_active}>OFF</option>
            </select>
          </td>
          <td class="py-4">
            <RowActions
              isSaving={rowStates[row.id]?.isSaving}
              isDeleting={rowStates[row.id]?.isDeleting}
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>

<ToastNotification bind:this={toastRef} />
