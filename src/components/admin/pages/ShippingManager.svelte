<script module lang="ts">
  export type RuleRow = {
    id: string | number;
    name: string;
    type: string;
    priority: number;
    config_json: string;
    is_active: boolean;
  };
</script>

<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import RowActions from "../RowActions.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { initShippingRuleConfig } from "../../../lib/admin-shipping-client";
  import { onMount } from "svelte";

  let { rows = [] }: { rows: RuleRow[] } = $props();

  let csrfToken = "";
  let configBuilder: (() => unknown) | null = null;
  let isSubmitting = $state(false);
  let isSimulating = $state(false);
  let rowStates = $state<
    Record<string, { isSaving?: boolean; isDeleting?: boolean }>
  >({});
  let toastRef: ToastNotification;

  onMount(() => {
    csrfToken =
      document
        .querySelector("meta[name='csrf-token']")
        ?.getAttribute("content") || "";

    const form = document.querySelector<HTMLFormElement>("#shipping-rule-form");
    if (form) {
      configBuilder = initShippingRuleConfig(form);
    }
  });

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget as HTMLFormElement;
    isSubmitting = true;

    try {
      const formData = new FormData(form);
      const config = configBuilder ? configBuilder() : {};
      const payload = {
        ...Object.fromEntries(formData.entries()),
        config,
      };

      const response = await fetch("/api/admin/shipping-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        toastRef?.show(await response.text(), "error");
        return;
      }
      toastRef?.show("Rule pengiriman berhasil ditambahkan!", "success");
      setTimeout(() => location.reload(), 800);
    } catch (err: any) {
      toastRef?.show(err.message || "Gagal membuat rule pengiriman", "error");
    } finally {
      isSubmitting = false;
    }
  };

  const handleTableClick = async (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    if (!action) return;
    const row = target.closest("tr[data-id]");
    if (!row) return;
    const id = row.getAttribute("data-id");
    if (!id) return;

    if (action === "delete") {
      if (!confirm("Hapus rule ini?")) return;

      rowStates[id] = { ...rowStates[id], isDeleting: true };

      try {
        const response = await fetch(`/api/admin/shipping-rules/${id}`, {
          method: "DELETE",
          headers: { "X-CSRF-Token": csrfToken },
        });
        if (!response.ok) {
          toastRef?.show(await response.text(), "error");
          rowStates[id] = { ...rowStates[id], isDeleting: false };
          return;
        }
        toastRef?.show("Rule pengiriman dihapus", "success");
        setTimeout(() => location.reload(), 800);
      } catch (err: any) {
        toastRef?.show(err.message || "Gagal menghapus rule", "error");
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
            cell instanceof HTMLInputElement ||
            cell instanceof HTMLTextAreaElement
          ) {
            fields[field] = String(cell.value);
            return;
          }
          fields[field] = String(cell.textContent?.trim() || "");
        });

        const payload = {
          name: fields.name || "",
          type: fields.type || "",
          priority: Number(fields.priority || 0),
          config: fields.config ? JSON.parse(fields.config) : {},
          is_active: fields.is_active,
        };

        const response = await fetch(`/api/admin/shipping-rules/${id}`, {
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
        toastRef?.show("Rule diperbarui", "success");
        setTimeout(() => location.reload(), 800);
      } catch (err: any) {
        toastRef?.show(err.message || "Kesalahan perbaruan", "error");
        rowStates[id] = { ...rowStates[id], isSaving: false };
      }
    }
  };

  let simulateMessage = $state("");

  const handleSimulation = async (event: SubmitEvent) => {
    event.preventDefault();
    if (isSimulating) return;

    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;

    isSimulating = true;
    simulateMessage = "";

    try {
      const data = new FormData(form);
      const payload = {
        subtotal: Number(data.get("subtotal") || 0),
        province: String(data.get("province") || ""),
        city: String(data.get("city") || ""),
        district: String(data.get("district") || ""),
        free_shipping: String(data.get("free_shipping") || "false") === "true",
      };

      const response = await fetch("/api/admin/shipping-simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        toastRef?.show(await response.text(), "error");
        return;
      }

      const result = (await response.json()) as { fee: number; rule: string };
      simulateMessage = `Rule: ${result.rule} | Ongkir: Rp ${Number(result.fee).toLocaleString("id-ID")}`;
      toastRef?.show("Simulasi berhasil dijalankan", "success");
    } catch (err: any) {
      toastRef?.show(err.message || "Simulasi gagal", "error");
    } finally {
      isSimulating = false;
    }
  };
</script>

<SectionHeader title="Tambah Rule" badge="Ongkir dinamis" />
<CrudInlineForm id="shipping-rule-form" on:submit={handleCreate} {isSubmitting}>
  <div class="space-y-6 border-b border-stone-100 pb-8 mb-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Rule Identity -->
      <div
        class="space-y-4 border-b border-stone-100 lg:border-b-0 lg:border-r lg:pr-8 pb-6 lg:pb-0"
      >
        <div class="space-y-1.5">
          <label
            for="name"
            class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
            >Nama Aturan</label
          >
          <input
            id="name"
            name="name"
            required
            placeholder="Cth: Jabodetabek Flat"
            class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label
              for="type"
              class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
              >Tipe</label
            >
            <select
              id="type"
              name="type"
              class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none appearance-none cursor-pointer font-medium"
            >
              <option value="flat">Flat Fee</option>
              <option value="free_threshold">Threshold</option>
              <option value="zone">Zonasi</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label
              for="priority"
              class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
              >Prioritas</label
            >
            <input
              id="priority"
              name="priority"
              type="number"
              value="100"
              class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold"
            />
          </div>
        </div>
      </div>

      <!-- Config Inputs -->
      <div class="lg:col-span-2 space-y-4">
        <label
          class="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2"
          >Konfigurasi Aturan</label
        >

        <div id="flat-config" class="space-y-1.5">
          <label
            for="flat_fee"
            class="block text-xs font-semibold text-stone-600"
            >Flat Fee (Rp)</label
          >
          <input
            id="flat_fee"
            name="flat_fee"
            type="number"
            value="10000"
            class="w-full md:w-64 px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold tabular-nums"
          />
        </div>

        <div
          id="threshold-config"
          class="hidden grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div class="space-y-1.5">
            <label
              for="threshold_amount"
              class="block text-xs font-semibold text-stone-600"
              >Min. Belanja untuk Gratis (Rp)</label
            >
            <input
              id="threshold_amount"
              name="threshold_amount"
              type="number"
              value="150000"
              class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold tabular-nums"
            />
          </div>
          <div class="space-y-1.5">
            <label
              for="threshold_fee"
              class="block text-xs font-semibold text-stone-600"
              >Biaya di bawah limit (Rp)</label
            >
            <input
              id="threshold_fee"
              name="threshold_fee"
              type="number"
              value="10000"
              class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold tabular-nums"
            />
          </div>
        </div>

        <div id="zone-config" class="hidden space-y-1.5">
          <label
            for="zone_list"
            class="block text-xs font-semibold text-stone-600"
            >Daftar Zona (Pihak Ke-3 / Custom)</label
          >
          <textarea
            id="zone_list"
            name="zone_list"
            rows="4"
            placeholder="DI Yogyakarta|Bantul|Sewon|8000\nDI Yogyakarta|Sleman||12000"
            class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm font-mono outline-none resize-none"
          ></textarea>
          <p class="text-[10px] text-stone-400 italic mt-1">
            Format: <span
              class="bg-stone-50 px-1 py-0.5 rounded border border-stone-100"
              >provinsi|kota|kecamatan|biaya</span
            >, pisahkan baris baru.
          </p>
        </div>

        <div class="pt-2">
          <label
            for="config_preview"
            class="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5"
            >Preview JSON Konfigurasi</label
          >
          <textarea
            id="config_preview"
            name="config_preview"
            rows="2"
            readonly
            class="w-full px-4 py-2.5 rounded-xl border border-stone-100 bg-stone-50 text-stone-400 text-[11px] font-mono overflow-auto resize-none outline-none cursor-default"
          ></textarea>
        </div>
      </div>
    </div>
  </div>

  <div class="flex items-center justify-between gap-4 mt-6">
    <div class="hidden md:block">
      <p class="text-xs text-stone-400 italic">
        Rule dengan prioritas lebih tinggi (angka kecil) akan diproses lebih
        dulu.
      </p>
    </div>
    <button
      class="flex items-center justify-center gap-3 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
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
      Simpan Aturan
    </button>
  </div>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Rule" muted="Klik sel untuk edit" />
</div>
<div class="mt-6">
  <SectionHeader title="Simulasi Ongkir" badge="Test Rule" />
  <div
    class="mt-4 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm max-w-5xl"
  >
    <CrudInlineForm
      class="p-8"
      on:submit={handleSimulation}
      isSubmitting={isSimulating}
    >
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <div class="space-y-1.5">
          <label
            for="subtotal"
            class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
            >Subtotal (Rp)</label
          >
          <input
            id="subtotal"
            name="subtotal"
            type="number"
            value="150000"
            class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold tabular-nums"
          />
        </div>
        <div class="space-y-1.5">
          <label
            for="province"
            class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
            >Provinsi</label
          >
          <input
            id="province"
            name="province"
            value="DI Yogyakarta"
            class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
          />
        </div>
        <div class="space-y-1.5">
          <label
            for="city"
            class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
            >Kota / Kab</label
          >
          <input
            id="city"
            name="city"
            value="Bantul"
            class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
          />
        </div>
        <div class="space-y-1.5">
          <label
            for="district"
            class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
            >Kecamatan</label
          >
          <input
            id="district"
            name="district"
            value="Sewon"
            class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
          />
        </div>
        <div class="space-y-1.5">
          <label
            for="free_shipping"
            class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
            >Free Promo?</label
          >
          <select
            id="free_shipping"
            name="free_shipping"
            class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm appearance-none cursor-pointer outline-none font-medium"
          >
            <option value="false">Tidak Ada</option>
            <option value="true">Ada Promo</option>
          </select>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row items-center gap-4 mt-8">
        <button
          class="flex items-center justify-center gap-3 h-[42px] px-8 rounded-xl bg-[#c48a3a] border border-transparent text-white text-sm font-semibold hover:bg-[#a6722d] transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto shadow-md shadow-[#c48a3a]/20"
          type="submit"
          disabled={isSimulating}
        >
          {#if isSimulating}
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
          Hitung Estimasi Ongkir
        </button>
        {#if simulateMessage}
          <div
            class="bg-stone-50 text-stone-800 px-6 py-2.5 rounded-xl text-sm font-semibold border border-stone-200 flex-1 flex items-center shadow-inner w-full"
          >
            <span class="mr-3 text-lg">🚚</span>
            {simulateMessage}
          </div>
        {/if}
      </div>
    </CrudInlineForm>
  </div>
</div>

<AdminDataTable class="mt-2" onclick={handleTableClick}>
  <thead>
    <tr>
      <th>Nama</th>
      <th>Tipe</th>
      <th>Prioritas</th>
      <th>Config</th>
      <th>Status</th>
      <th>Aksi</th>
    </tr>
  </thead>
  <tbody>
    {#if rows.length === 0}
      <tr>
        <td colspan="6" class="text-center py-12 text-stone-400 text-sm italic"
          >Belum ada rule pengiriman aktif.</td
        >
      </tr>
    {/if}
    {#each rows as row (row.id)}
      <tr
        data-id={row.id}
        class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
      >
        <td
          contenteditable="true"
          data-field="name"
          class="py-4 font-bold text-stone-900 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-3 py-1.5 rounded-lg border border-transparent transition-all"
          >{row.name}</td
        >
        <td class="py-4">
          <select
            data-field="type"
            class="px-3 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white transition-all bg-transparent text-xs font-bold uppercase cursor-pointer outline-none"
          >
            <option value="flat" selected={row.type === "flat"}>Flat</option>
            <option
              value="free_threshold"
              selected={row.type === "free_threshold"}>Threshold</option
            >
            <option value="zone" selected={row.type === "zone"}>Zone</option>
          </select>
        </td>
        <td
          contenteditable="true"
          data-field="priority"
          class="py-4 tabular-nums font-bold text-stone-600 outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all text-center"
          >{row.priority}</td
        >
        <td class="py-4">
          <textarea
            data-field="config"
            rows="2"
            class="w-full bg-transparent border-transparent hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] rounded-lg px-3 py-1.5 text-[10px] font-mono transition-all outline-none resize-none"
            >{row.config_json}</textarea
          >
        </td>
        <td class="py-4 text-center">
          <select
            data-field="is_active"
            class="px-3 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white transition-all bg-transparent font-bold cursor-pointer outline-none text-xs"
          >
            <option value="true" selected={row.is_active}>AKTIF</option>
            <option value="false" selected={!row.is_active}>NONAKTIF</option>
          </select>
        </td>
        <td class="py-4 text-right pr-4">
          <RowActions
            isSaving={rowStates[row.id]?.isSaving}
            isDeleting={rowStates[row.id]?.isDeleting}
          />
        </td>
      </tr>
    {/each}
  </tbody>
</AdminDataTable>

<ToastNotification bind:this={toastRef} />
