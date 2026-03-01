<script lang="ts">
import { actions } from "astro:actions";
import { fly } from "svelte/transition";
import ToastNotification from "../ToastNotification.svelte";

let toastRef = $state<ToastNotification>();
let isSubmitting = $state(false);
let isSeeding = $state(false);

let preorderOnly = $state(false);
let leadTimeHours = $state(0);
let cutoffTime = $state("");
let sameDayEnabled = $state(false);
let availableDays = $state("");
let deliveryProvince = $state("DI Yogyakarta");
let freeDeliveryThreshold = $state(0);

const fetchSettings = async () => {
  const { data, error } = await actions.getSettings({});
  if (!error && data) {
    const os = data.order_settings || {};
    const ds = data.delivery_settings || {};

    preorderOnly = os.preorderOnly ?? os.preorder_only ?? false;
    leadTimeHours = os.minimumLeadTimeHours ?? os.minimum_lead_time_hours ?? 0;
    cutoffTime = os.cutoffTime ?? os.cutoff_time ?? "";
    sameDayEnabled = os.sameDayEnabled ?? os.same_day_enabled ?? false;
    availableDays = (os.availableDays ?? os.available_days ?? []).join(", ");
    deliveryProvince = ds.deliveryProvince ?? ds.delivery_province ?? "DI Yogyakarta";
    freeDeliveryThreshold = ds.freeDeliveryThreshold ?? ds.free_delivery_threshold ?? 0;
  }
};

$effect(() => {
  fetchSettings();
});

const formatDays = (value: string) =>
  value
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter(Boolean);

const handleSubmit = async (event: SubmitEvent) => {
  event.preventDefault();
  isSubmitting = true;
  const { error } = await actions.updateSettings({
    orderSettings: {
      preorderOnly,
      minimumLeadTimeHours: Number(leadTimeHours),
      cutoffTime,
      sameDayEnabled,
      availableDays: formatDays(availableDays),
    },
    deliverySettings: {
      deliveryProvince,
      freeDeliveryThreshold: Number(freeDeliveryThreshold),
    },
  });
  isSubmitting = false;

  if (error) {
    toastRef?.show(error.message, "error");
  } else {
    toastRef?.show("Pengaturan berhasil disimpan!", "success");
  }
};

const handleSeed = async () => {
  toastRef?.show("Fungsi Generate Data Demo dinonaktifkan sementara.", "error");
};
</script>

<div in:fly={{ y: 20, duration: 400, delay: 100 }} class="space-y-8">
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
      onclick={handleSeed}
      disabled={isSeeding || isSubmitting}
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

  <form id="settings-form" onsubmit={handleSubmit} class="space-y-8">
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
                bind:value={preorderOnly}
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
        disabled={isSubmitting || isSeeding}
      >
        {#if isSubmitting}
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

<ToastNotification bind:this={toastRef} />
