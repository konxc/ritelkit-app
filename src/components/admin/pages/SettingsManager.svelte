<script lang="ts" context="module">
  export type OrderSettingsPayload = {
    preorder_only?: boolean;
    minimum_lead_time_hours?: number;
    cutoff_time?: string;
    same_day_enabled?: boolean;
    available_days?: string[];
  };

  export type DeliverySettingsPayload = {
    delivery_province?: string;
    free_delivery_threshold?: number;
  };
</script>

<script lang="ts">
  import SectionHeader from "../SectionHeader.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import PanelCard from "../PanelCard.svelte";
  import { onMount } from "svelte";

  export let orderSettings: OrderSettingsPayload = {};
  export let deliverySettings: DeliverySettingsPayload = {};

  let premiereOnly = orderSettings.preorder_only ?? false;
  let leadTimeHours = orderSettings.minimum_lead_time_hours ?? 0;
  let cutoffTime = orderSettings.cutoff_time ?? "";
  let sameDayEnabled = orderSettings.same_day_enabled ?? false;
  let availableDays = (orderSettings.available_days || []).join(", ");
  let deliveryProvince = deliverySettings.delivery_province ?? "DI Yogyakarta";
  let freeDeliveryThreshold = deliverySettings.free_delivery_threshold ?? 0;
  let csrfToken = "";
  let isSaving = false;
  let isSeeding = false;

  // Simple Custom Toast Logic
  let toastMessage = "";
  let toastType = "info"; // "success" | "error" | "info"

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    toastMessage = message;
    toastType = type;
    setTimeout(() => {
      toastMessage = "";
    }, 3500);
  };

  onMount(() => {
    csrfToken =
      document
        .querySelector("meta[name='csrf-token']")
        ?.getAttribute("content") || "";
  });

  const formatDays = (value: string) =>
    value
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const payloadForSubmit = () => ({
    order_settings: {
      preorder_only: premiereOnly,
      minimum_lead_time_hours: Number(leadTimeHours) || 0,
      cutoff_time: cutoffTime,
      same_day_enabled: sameDayEnabled,
      available_days: formatDays(availableDays),
    },
    delivery_settings: {
      delivery_province: deliveryProvince,
      free_delivery_threshold: Number(freeDeliveryThreshold) || 0,
    },
  });

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (isSaving || isSeeding) return;

    isSaving = true;
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(payloadForSubmit()),
      });
      if (!response.ok) {
        const text = await response.text();
        showToast(text || `Request gagal (${response.status})`, "error");
        return;
      }
      showToast("Pengaturan berhasil disimpan!", "success");
      setTimeout(() => location.reload(), 800);
    } catch (err: any) {
      showToast(err.message || "Terjadi kesalahan jaringan", "error");
    } finally {
      isSaving = false;
    }
  };

  const handleSeed = async () => {
    if (isSaving || isSeeding) return;
    if (!confirm("Generate data demo?")) return;

    isSeeding = true;
    try {
      const response = await fetch("/api/admin/seed", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken,
        },
      });
      if (!response.ok) {
        const text = await response.text();
        showToast(text || `Request gagal (${response.status})`, "error");
        return;
      }
      showToast("Seed data selesai", "success");
      setTimeout(() => location.reload(), 800);
    } catch (err: any) {
      showToast(err.message || "Terjadi kesalahan jaringan", "error");
    } finally {
      isSeeding = false;
    }
  };
</script>

<div class="space-y-8 animate-fade-in-up">
  <div>
    <h1
      class="font-['Syne',sans-serif] text-3xl font-extrabold text-stone-900 tracking-tight"
    >
      Pengaturan Operasional
    </h1>
    <p class="text-stone-500 mt-2 max-w-2xl">
      Semua perubahan pengaturan di bawah ini akan langsung memengaruhi
      operasional toko. Gunakan data demo jika Anda ingin melakukan simulasi
      pengaturan sistem.
    </p>
  </div>

  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-stone-50 p-6 rounded-2xl border border-stone-200/60"
  >
    <div class="flex items-start gap-3 text-stone-600">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-[#c48a3a] shrink-0 mt-0.5"
        ><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path
          d="M12 8h.01"
        /></svg
      >
      <div>
        <h4 class="font-bold text-sm text-stone-900 mb-0.5">Mode Simulasi</h4>
        <p class="text-sm">
          Anda dapat mengisi data sampel untuk menguji konfigurasi toko Anda.
        </p>
      </div>
    </div>
    <button
      class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold text-stone-600 hover:text-stone-900 hover:border-stone-300 hover:shadow-sm transition-all shadow-sm w-full sm:w-auto shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      type="button"
      on:click={handleSeed}
      disabled={isSeeding || isSaving}
      aria-label="Generate Data Demo"
    >
      {#if isSeeding}
        <svg
          class="animate-spin -ml-1 mr-2 h-4 w-4 text-stone-600"
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
        Generating...
      {:else}
        Generate Data Demo
      {/if}
    </button>
  </div>

  <form id="settings-form" on:submit={handleSubmit} class="space-y-8">
    <div class="grid gap-8 lg:grid-cols-2">
      <!-- Panel 1: Model Order -->
      <div
        class="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6"
      >
        <div class="border-b border-stone-100 pb-4">
          <h3 class="font-['Syne',sans-serif] text-xl font-bold text-stone-800">
            Model Order
          </h3>
          <p class="text-sm text-stone-500 mt-1">
            Atur ketersediaan dan ketentuan pemesanan produk Anda.
          </p>
        </div>

        <div class="space-y-5">
          <div class="space-y-1.5">
            <label
              for="preorder"
              class="block text-sm font-semibold text-stone-700"
              >Preorder Only</label
            >
            <div class="relative">
              <select
                id="preorder"
                bind:value={premiereOnly}
                class="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all text-stone-900 appearance-none cursor-pointer"
              >
                <option value={true}>Ya, hanya menerima Preorder</option>
                <option value={false}
                  >Tidak, produk siap jual (Ready Stock)</option
                >
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                ><path d="m6 9 6 6 6-6" /></svg
              >
            </div>
            <p class="text-xs text-stone-500">
              Jika aktif, semua pesanan akan dianggap sebagai sistem pre-order.
            </p>
          </div>

          <div class="space-y-1.5">
            <label
              for="lead_time"
              class="block text-sm font-semibold text-stone-700"
              >Minimum Lead Time (jam)</label
            >
            <input
              id="lead_time"
              type="number"
              min="0"
              bind:value={leadTimeHours}
              class="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all text-stone-900"
              aria-describedby="lead_time_help"
            />
            <p id="lead_time_help" class="text-xs text-stone-500">
              Waktu minimal yang dibutuhkan untuk mempersiapkan pesanan sebelum
              dikirim/diambil.
            </p>
          </div>

          <div class="space-y-1.5">
            <label
              for="cutoff_time"
              class="block text-sm font-semibold text-stone-700"
              >Cutoff Time (Harian)</label
            >
            <input
              id="cutoff_time"
              type="time"
              bind:value={cutoffTime}
              class="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all text-stone-900"
              aria-describedby="cutoff_time_help"
            />
            <p id="cutoff_time_help" class="text-xs text-stone-500">
              Batas akhir waktu pemesanan untuk diproses pada hari yang sama.
            </p>
          </div>

          <div class="space-y-1.5">
            <label
              for="sameday_enabled"
              class="block text-sm font-semibold text-stone-700"
              >Same Day Delivery / Pickup</label
            >
            <div class="relative">
              <select
                id="sameday_enabled"
                bind:value={sameDayEnabled}
                class="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all text-stone-900 appearance-none cursor-pointer"
              >
                <option value={true}>Aktifkan</option>
                <option value={false}>Nonaktifkan</option>
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                ><path d="m6 9 6 6 6-6" /></svg
              >
            </div>
            <p class="text-xs text-stone-500">
              Izinkan layanan pemesanan dan pengiriman pada hari yang sama.
            </p>
          </div>

          <div class="space-y-1.5">
            <label
              for="available_days"
              class="block text-sm font-semibold text-stone-700"
              >Hari Operasional (Tersedia)</label
            >
            <input
              id="available_days"
              type="text"
              bind:value={availableDays}
              placeholder="Senin, Selasa, Rabu, Kamis, Jumat, Sabtu"
              class="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all text-stone-900"
              aria-describedby="available_days_help"
            />
            <p id="available_days_help" class="text-xs text-stone-500">
              Pisahkan nama hari dengan koma (contoh: Senin, Selasa, Rabu).
            </p>
          </div>
        </div>
      </div>

      <!-- Panel 2: Pengiriman -->
      <div
        class="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6 self-start"
      >
        <div class="border-b border-stone-100 pb-4">
          <h3 class="font-['Syne',sans-serif] text-xl font-bold text-stone-800">
            Pengiriman
          </h3>
          <p class="text-sm text-stone-500 mt-1">
            Konfigurasi nilai default untuk ongkos kirim.
          </p>
        </div>

        <div class="space-y-5">
          <div class="space-y-1.5">
            <label
              for="delivery_province"
              class="block text-sm font-semibold text-stone-700"
              >Provinsi Default Pengiriman</label
            >
            <input
              id="delivery_province"
              type="text"
              bind:value={deliveryProvince}
              placeholder="Contoh: DI Yogyakarta"
              class="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all text-stone-900"
            />
          </div>

          <div class="space-y-1.5">
            <label
              for="free_delivery_threshold"
              class="block text-sm font-semibold text-stone-700"
              >Batas Minimal Gratis Ongkir (Rp)</label
            >
            <div class="relative">
              <span
                class="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-medium"
                >Rp</span
              >
              <input
                id="free_delivery_threshold"
                type="number"
                min="0"
                step="1000"
                bind:value={freeDeliveryThreshold}
                class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all text-stone-900"
                aria-describedby="free_delivery_help"
              />
            </div>
            <p id="free_delivery_help" class="text-xs text-stone-500">
              Atur nilai ke 0 jika tidak ada promo gratis ongkir.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end pt-4 border-t border-stone-200">
      <button
        class="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#c48a3a] to-[#a6722d] text-white font-bold shadow-[0_8px_16px_rgba(196,138,58,0.25)] hover:-translate-y-0.5 transition-all w-full md:w-auto disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
        type="submit"
        disabled={isSaving || isSeeding}
      >
        {#if isSaving}
          <svg
            class="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
          Menyimpan...
        {:else}
          Simpan Pengaturan
        {/if}
      </button>
    </div>
  </form>
</div>

{#if toastMessage}
  <div class="fixed bottom-6 right-6 z-50 animate-fade-in-up" role="alert">
    <div
      class="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border
      {toastType === 'success'
        ? 'bg-green-50/95 border-green-200/80'
        : toastType === 'error'
          ? 'bg-red-50/95 border-red-200/80'
          : 'bg-stone-50/95 border-stone-200/80'} backdrop-blur-md"
    >
      <div
        class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        {toastType === 'success'
          ? 'bg-green-100 text-green-600'
          : toastType === 'error'
            ? 'bg-red-100 text-red-600'
            : 'bg-stone-200 text-stone-600'}"
      >
        {#if toastType === "success"}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><polyline points="20 6 9 17 4 12"></polyline></svg
          >
        {:else if toastType === "error"}
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
            ><line x1="18" y1="6" x2="6" y2="18"></line><line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
            ></line></svg
          >
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
            ><circle cx="12" cy="12" r="10"></circle><line
              x1="12"
              y1="16"
              x2="12"
              y2="12"
            ></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg
          >
        {/if}
      </div>
      <p
        class="text-[0.95rem] font-semibold {toastType === 'success'
          ? 'text-green-800'
          : toastType === 'error'
            ? 'text-red-800'
            : 'text-stone-800'}"
      >
        {toastMessage}
      </p>
    </div>
  </div>
{/if}
