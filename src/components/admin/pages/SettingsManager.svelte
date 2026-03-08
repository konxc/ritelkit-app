<script lang="ts">
import { actions } from "astro:actions";
import { fly } from "svelte/transition";
import ToastNotification from "../ToastNotification.svelte";
import TextInput from "../ui/forms/TextInput.svelte";
import SelectInput from "../ui/forms/SelectInput.svelte";
import Button from "../ui/Button.svelte";

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
  toastRef?.show("Pembuatan data demo sementara tidak tersedia.", "error");
};
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }} class="space-y-8">
    <div>
      <h1 class="font-['Syne',sans-serif] text-3xl font-extrabold tracking-tight text-stone-900">
        Pengaturan Operasional
      </h1>
      <p class="mt-2 max-w-2xl text-stone-500">
        Semua perubahan pengaturan di bawah ini akan langsung memengaruhi operasional toko. Gunakan data demo jika Anda
        ingin melakukan simulasi pengaturan sistem.
      </p>
    </div>

    <div
      class="flex flex-col gap-4 rounded-2xl border border-stone-200/60 bg-stone-50 p-6 sm:flex-row sm:items-center sm:justify-between"
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
          class="mt-0.5 shrink-0 text-[#c48a3a]"
          ><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg
        >
        <div>
          <h4 class="mb-0.5 text-sm font-bold text-stone-900">Mode Simulasi</h4>
          <p class="text-sm">Anda dapat mengisi data sampel untuk menguji konfigurasi toko Anda.</p>
        </div>
      </div>
      <Button
        variant="outline"
        type="button"
        onclick={handleSeed}
        disabled={isSeeding || isSubmitting}
        aria-label="Buat Data Demo"
      >
        {#if isSeeding}
          <svg
            class="mr-2 -ml-1 h-4 w-4 animate-spin text-stone-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path></svg
          >
          Sedang menyiapkan data...
        {:else}
          Buat Data Demo
        {/if}
      </Button>
    </div>

    <form id="settings-form" onsubmit={handleSubmit} class="space-y-8">
      <div class="grid gap-8 lg:grid-cols-2">
        <!-- Panel 1: Model Pesanan -->
        <div
          class="space-y-6 rounded-3xl border border-stone-200/60 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:p-8"
        >
          <div class="border-b border-stone-100 pb-4">
            <h3 class="font-['Syne',sans-serif] text-xl font-bold text-stone-800">Model Pesanan</h3>
            <p class="mt-1 text-sm text-stone-500">Atur ketersediaan dan ketentuan pemesanan produk Anda.</p>
          </div>

          <div class="space-y-5">
            <SelectInput
              id="preorder"
              label="Hanya Preorder"
              bind:value={preorderOnly}
              options={[
                { label: "Ya, hanya menerima Preorder", value: true },
                {
                  label: "Tidak, produk siap jual (Stok Siap)",
                  value: false,
                },
              ]}
            />
            <p class="-mt-2.5 ml-1 text-xs text-stone-500">
              Jika aktif, semua pesanan akan dianggap sebagai sistem pre-order.
            </p>

            <TextInput
              id="lead_time"
              type="number"
              label="Waktu Tunda Minimum (jam)"
              min="0"
              bind:value={leadTimeHours}
              aria-describedby="lead_time_help"
            />
            <p id="lead_time_help" class="-mt-2.5 ml-1 text-xs text-stone-500">
              Waktu minimal yang dibutuhkan untuk mempersiapkan pesanan sebelum dikirim/diambil.
            </p>

            <TextInput
              id="cutoff_time"
              type="time"
              label="Batas Waktu (Harian)"
              bind:value={cutoffTime}
              aria-describedby="cutoff_time_help"
            />
            <p id="cutoff_time_help" class="-mt-2.5 ml-1 text-xs text-stone-500">
              Batas akhir waktu pemesanan untuk diproses pada hari yang sama.
            </p>

            <SelectInput
              id="sameday_enabled"
              label="Pengiriman / Ambil Hari yang Sama"
              bind:value={sameDayEnabled}
              options={[
                { label: "Aktifkan", value: true },
                { label: "Nonaktifkan", value: false },
              ]}
            />
            <p class="-mt-2.5 ml-1 text-xs text-stone-500">
              Izinkan layanan pemesanan dan pengiriman pada hari yang sama.
            </p>

            <TextInput
              id="available_days"
              type="text"
              label="Hari Operasional (Tersedia)"
              bind:value={availableDays}
              placeholder="Senin, Selasa, Rabu, Kamis, Jumat, Sabtu"
              aria-describedby="available_days_help"
            />
            <p id="available_days_help" class="-mt-2.5 ml-1 text-xs text-stone-500">
              Pisahkan nama hari dengan koma (contoh: Senin, Selasa, Rabu).
            </p>
          </div>
        </div>

        <!-- Panel 2: Pengiriman -->
        <div
          class="space-y-6 self-start rounded-3xl border border-stone-200/60 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:p-8"
        >
          <div class="border-b border-stone-100 pb-4">
            <h3 class="font-['Syne',sans-serif] text-xl font-bold text-stone-800">Pengiriman</h3>
            <p class="mt-1 text-sm text-stone-500">Konfigurasi nilai default untuk ongkos kirim.</p>
          </div>

          <div class="space-y-5">
            <TextInput
              id="delivery_province"
              type="text"
              label="Provinsi Default Pengiriman"
              bind:value={deliveryProvince}
              placeholder="Contoh: DI Yogyakarta"
            />

            <div class="space-y-1.5">
              <label for="free_delivery_threshold" class="block text-sm font-semibold text-stone-700"
                >Batas Minimal Gratis Ongkir (Rp)</label
              >
              <div class="relative">
                <span class="absolute top-1/2 left-4 z-10 -translate-y-1/2 font-medium text-stone-500">Rp</span>
                <TextInput
                  id="free_delivery_threshold"
                  type="number"
                  min="0"
                  step="1000"
                  bind:value={freeDeliveryThreshold}
                  class="pr-4 pl-11"
                  aria-describedby="free_delivery_help"
                />
              </div>
              <p id="free_delivery_help" class="-mt-1 ml-1 text-xs text-stone-500">
                Atur nilai ke 0 jika tidak ada promo gratis ongkir.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end border-t border-stone-200 pt-4">
        <Button variant="primary" type="submit" disabled={isSubmitting || isSeeding}>
          {#if isSubmitting}
            <svg
              class="mr-2 -ml-1 inline-block h-5 w-5 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path></svg
            >
            Menyimpan...
          {:else}
            Simpan Pengaturan
          {/if}
        </Button>
      </div>
    </form>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
