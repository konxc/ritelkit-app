<script lang="ts">
import { trpc } from "../../../lib/trpc";
import { fade, fly } from "svelte/transition";
import { createQuery, useQueryClient } from "@tanstack/svelte-query";
import { actions } from "astro:actions";
import AdminDataTable from "../AdminDataTable.svelte";
import CrudInlineForm from "../CrudInlineForm.svelte";
import RowActions from "../RowActions.svelte";
import SectionHeader from "../SectionHeader.svelte";
import ToastNotification from "../ToastNotification.svelte";

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

    toastRef?.show("Rule pengiriman berhasil ditambahkan!", "success");
    form.reset();
    configType = "flat";
    flatFee = 10000;
    thresholdAmount = 150000;
    thresholdFee = 10000;
    zoneList = "";
    queryClient.invalidateQueries({ queryKey: ["shippingRules.list"] });
    isDrawerOpen = false;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    toastRef?.show(message, "error");
  } finally {
    isSubmitting = false;
  }
};

const handleRowAction = async (
  id: string | number,
  action: string,
  rowElement: HTMLElement | null,
) => {
  const resolvedId = String(id);
  if (action === "delete") {
    if (confirm("Hapus rule ini?")) {
      deletingId = resolvedId;
      try {
        await trpc.shippingRules.delete.mutate(resolvedId);
        toastRef?.show("Rule pengiriman dihapus", "success");
        queryClient.invalidateQueries({ queryKey: ["shippingRules.list"] });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        toastRef?.show(message, "error");
      } finally {
        deletingId = null;
      }
    }
  } else if (action === "save" && rowElement) {
    const fields: Record<string, string> = {};
    rowElement.querySelectorAll("[data-field]").forEach((el) => {
      const field = el.getAttribute("data-field")!;
      if (
        el instanceof HTMLSelectElement ||
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement
      ) {
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
      toastRef?.show("Rule diperbarui", "success");
      queryClient.invalidateQueries({ queryKey: ["shippingRules.list"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
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
      simulateMessage = `Rule: ${String(data.rule || "-")} | Ongkir: Rp ${Number(data.fee || 0).toLocaleString("id-ID")}`;
    } else if (error) {
      simulateMessage = `Error: ${error.message}`;
    }
  } finally {
    isSimulating = false;
  }
};
</script>
<div class="flex items-center justify-between mt-2 mb-8">
  <SectionHeader title="Daftar Aturan" muted="Kelola dan konfigurasi ongkir" />
  <button
    class="flex items-center gap-2 px-4 py-2 bg-stone-900 border border-transparent rounded-xl text-white text-[0.85rem] font-bold shadow-sm hover:bg-stone-800 transition-all hover:shadow-md"
    onclick={() => isDrawerOpen = true}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
    Tambah Rule
  </button>
</div>

{#if isDrawerOpen}
<div class="fixed inset-0 z-[100] flex justify-end">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
    transition:fade={{duration: 200}} 
    onclick={() => isDrawerOpen = false}
  ></div>
  
  <div class="relative w-full max-w-lg bg-white border-l border-stone-100 h-full shadow-2xl flex flex-col z-[101]" transition:fly={{x: 400, opacity: 1, duration: 300}}>
    <div class="flex items-center justify-between px-6 py-5 border-b border-stone-100 bg-stone-50/50">
      <div>
        <h3 class="font-bold text-stone-800 text-lg">Tambah Rule</h3>
        <p class="text-xs font-semibold text-stone-400 mt-0.5 uppercase tracking-wider">Ongkir dinamis</p>
      </div>
      <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 text-stone-500 transition-colors" onclick={() => isDrawerOpen = false} aria-label="Tutup Panel">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto w-full custom-scrollbar">
      <CrudInlineForm
        id="shipping-rule-form"
        onsubmit={handleCreate}
        isSubmitting={isSubmitting}
      >
        <div class="p-6 space-y-8">
          
          <div class="space-y-6">
            <h4 class="text-xs font-bold text-[#c48a3a] uppercase tracking-widest border-b border-[#c48a3a]/20 pb-2">Identitas Rule</h4>
            <div class="space-y-4">
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
                    bind:value={configType}
                    class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none appearance-none cursor-pointer font-medium"
                  >
                    <option value="flat">💵 Flat Fee</option>
                    <option value="free_threshold">🛒 Free Threshold</option>
                    <option value="zone">🗺️ Zonasi</option>
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
                    class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <h4 class="text-xs font-bold text-[#c48a3a] uppercase tracking-widest border-b border-[#c48a3a]/20 pb-2">Konfigurasi Aturan</h4>
            <div class="space-y-4 bg-stone-50/50 p-4 border border-stone-100 rounded-2xl">
              {#if configType === "flat"}
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
                    bind:value={flatFee}
                    class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold tabular-nums"
                  />
                </div>
              {:else if configType === "free_threshold"}
                <div
                  id="threshold-config"
                  class="space-y-4"
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
                      bind:value={thresholdAmount}
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
                      bind:value={thresholdFee}
                      class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold tabular-nums"
                    />
                  </div>
                </div>
              {:else if configType === "zone"}
                <div id="zone-config" class="space-y-1.5">
                  <label
                    for="zone_list"
                    class="block text-xs font-semibold text-stone-600"
                    >Daftar Zona (Pihak Ke-3 / Custom)</label
                  >
                  <textarea
                    id="zone_list"
                    name="zone_list"
                    rows="4"
                    bind:value={zoneList}
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
              {/if}

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
                  value={configPreview}
                  readonly
                  class="w-full px-4 py-2.5 rounded-xl border border-stone-100 bg-stone-100 text-stone-500 text-[11px] font-mono overflow-auto resize-none outline-none cursor-default"
                ></textarea>
              </div>
            </div>
            <div class="pt-2 border-t border-stone-100">
              <p class="text-xs text-stone-400 italic mt-4 mb-2">
                * Rule dengan prioritas lebih tinggi (angka kecil) akan diproses lebih dulu.
              </p>
            </div>
          </div>
        </div>
        
        <div class="p-6 pt-4 border-t border-stone-100 bg-stone-50/30 sticky bottom-0 z-10 w-full mt-auto">
          <button
            class="flex items-center justify-center gap-2 h-[46px] rounded-xl bg-gradient-to-r from-[#c48a3a] to-[#a6722d] text-white text-sm font-bold hover:shadow-[0_4px_12px_rgba(196,138,58,0.25)] hover:-translate-y-0.5 transition-all shadow-md w-full disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <svg class="animate-spin h-4 w-4 mr-1 inline" viewBox="0 0 24 24"
                ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            {/if}
            Simpan Aturan
          </button>
        </div>
      </CrudInlineForm>
    </div>
  </div>
</div>
{/if}

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
      onsubmit={handleSimulation}
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
            class="bg-stone-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold border-none flex-1 flex items-center shadow-lg w-full transition-all duration-300"
            transition:fade={{ duration: 200 }}
          >
            <span class="mr-3 text-lg">{simulateMessage.includes("Error") ? '❌' : '✅'}</span>
            <span class="opacity-90 leading-relaxed font-mono">{simulateMessage}</span>
          </div>
        {/if}
      </div>
    </CrudInlineForm>
  </div>
</div>

<AdminDataTable class="mt-2">
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
    {#if currentRules.length === 0}
      <tr>
        <td colspan="6" class="text-center py-12 text-stone-400 text-sm italic"
          >Belum ada rule pengiriman aktif.</td
        >
      </tr>
    {/if}
    {#each currentRules as row (row.id)}
      <tr
        transition:fade={{ duration: 200 }}
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
            <option value="flat" selected={row.type === "flat"}>💵 Flat</option>
            <option
              value="free_threshold"
              selected={row.type === "free_threshold"}>🛒 Threshold</option
            >
            <option value="zone" selected={row.type === "zone"}>🗺️ Zone</option>
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
            >{row.configJson}</textarea
          >
        </td>
        <td class="py-4 text-center">
          <select
            data-field="isActive"
            class="px-3 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white transition-all bg-transparent font-bold cursor-pointer outline-none text-xs"
          >
            <option value="true" selected={!!row.isActive}>🟢 AKTIF</option>
            <option value="false" selected={!row.isActive}>🔴 NONAKTIF</option>
          </select>
        </td>
        <td class="py-4 text-right pr-4">
          <RowActions
            isSaving={savingId === row.id}
            isDeleting={deletingId === row.id}
            onSave={(e) =>
              handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
            onDelete={() => handleRowAction(row.id, "delete", null)}
          />
        </td>
      </tr>
    {/each}
  </tbody>
</AdminDataTable>
<ToastNotification bind:this={toastRef} />
