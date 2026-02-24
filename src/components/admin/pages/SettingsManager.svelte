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
  import ActionGroup from "../ActionGroup.svelte";
  import { getCsrfToken, readError } from "../../../lib/admin-client";

  export let orderSettings: OrderSettingsPayload = {};
  export let deliverySettings: DeliverySettingsPayload = {};

  let premiereOnly = orderSettings.preorder_only ?? false;
  let leadTimeHours = orderSettings.minimum_lead_time_hours ?? 0;
  let cutoffTime = orderSettings.cutoff_time ?? "";
  let sameDayEnabled = orderSettings.same_day_enabled ?? false;
  let availableDays = (orderSettings.available_days || []).join(", ");
  let deliveryProvince = deliverySettings.delivery_province ?? "DI Yogyakarta";
  let freeDeliveryThreshold = deliverySettings.free_delivery_threshold ?? 0;

  const csrfToken = getCsrfToken();

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
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(payloadForSubmit()),
    });
    if (!response.ok) {
      alert(await readError(response));
      return;
    }
    alert("Pengaturan tersimpan");
    location.reload();
  };

  const handleSeed = async () => {
    if (!confirm("Generate data demo?")) return;
    const response = await fetch("/api/admin/seed", {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
    });
    if (!response.ok) {
      alert(await readError(response));
      return;
    }
    alert("Seed data selesai");
    location.reload();
  };
</script>

<div class="space-y-6">
  <SectionHeader title="Pengaturan Operasional" badge="Dinamis" />
  <div
    class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
  >
    <p class="muted text-sm max-w-xl">
      Semua perubahan langsung tersimpan ke database. Gunakan tombol tambah data
      demo jika ingin mengisi ulang data percobaan.
    </p>
    <ActionGroup>
      <button class="btn-ghost" type="button" on:click={handleSeed}>
        Generate Data Demo
      </button>
    </ActionGroup>
  </div>

  <CrudInlineForm id="settings-form" on:submit={handleSubmit}>
    <div class="grid gap-4 md:grid-cols-2">
      <PanelCard>
        <h3 class="mb-3 text-lg font-semibold">Model Order</h3>
        <label for="preorder" class="mt-3">Preorder Only</label>
        <select id="preorder" bind:value={premiereOnly} class="mt-1">
          <option value={true}>Ya</option>
          <option value={false}>Tidak</option>
        </select>
        <label for="lead_time" class="mt-3">Minimum Lead Time (jam)</label>
        <input
          id="lead_time"
          type="number"
          bind:value={leadTimeHours}
          class="mt-1"
        />
        <label for="cutoff_time" class="mt-3">Cutoff Time (HH:mm)</label>
        <input
          id="cutoff_time"
          type="text"
          bind:value={cutoffTime}
          class="mt-1"
        />
        <label for="sameday_enabled" class="mt-3">Same Day Enabled</label>
        <select id="sameday_enabled" bind:value={sameDayEnabled} class="mt-1">
          <option value={true}>Ya</option>
          <option value={false}>Tidak</option>
        </select>
        <label for="available_days" class="mt-3"
          >Available Days (pisahkan koma)</label
        >
        <input
          id="available_days"
          type="text"
          bind:value={availableDays}
          class="mt-1"
        />
      </PanelCard>
      <PanelCard>
        <h3 class="mb-3 text-lg font-semibold">Pengiriman</h3>
        <label for="delivery_province" class="mt-3">Provinsi Default</label>
        <input
          id="delivery_province"
          type="text"
          bind:value={deliveryProvince}
          class="mt-1"
        />
        <label for="free_delivery_threshold" class="mt-3"
          >Free Delivery Threshold (Rp)</label
        >
        <input
          id="free_delivery_threshold"
          type="number"
          bind:value={freeDeliveryThreshold}
          class="mt-1"
        />
      </PanelCard>
    </div>
    <button class="primary mt-4" type="submit">Simpan Pengaturan</button>
  </CrudInlineForm>
</div>
