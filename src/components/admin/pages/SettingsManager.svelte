<script lang="ts">
  let { lang }: { lang?: any } = $props();
  initI18n(untrack(() => lang));

  import { trpc } from "@/lib/trpc";
  import { createQuery } from "@tanstack/svelte-query";
  import { fly } from "svelte/transition";
  import { t, initI18n } from "@/lib/i18n/store.svelte";
  import { untrack } from "svelte";
  import ToastNotification from "@/components/admin/ToastNotification.svelte";
  import TextInput from "@/components/admin/ui/forms/TextInput.svelte";
  import SelectInput from "@/components/admin/ui/forms/SelectInput.svelte";
  import Button from "@/components/admin/ui/Button.svelte";
  import { createAdminMutation } from "@/lib/admin-mutations.svelte";

  let toastRef = $state<ToastNotification>();

  // Local state for form fields, initialized from query data
  let preorderOnly = $state(false);
  let leadTimeHours = $state(0);
  let cutoffTime = $state("");
  let sameDayEnabled = $state(false);
  let availableDays = $state("");
  let deliveryProvince = $state("DI Yogyakarta");
  let freeDeliveryThreshold = $state(0);

  const query = createQuery(() => ({
    queryKey: ["settings"],
    queryFn: () => trpc.settings.get.query(),
  }));

  $effect(() => {
    if (query.data) {
      const data = query.data as Record<string, any>;
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
  });

  const mutation = createAdminMutation(
    (data: any) => trpc.settings.update.mutate(data),
    {
      invalidateKeys: [["settings"]],
      successMessage: t("system_admin.settings.toast_success"),
    },
    () => toastRef,
  );

  const formatDays = (value: string) =>
    value
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    await mutation.mutate({
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
  };

  const handleSeed = async () => {
    toastRef?.show(t("system_admin.settings.seed_unavailable"), "error");
  };
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }} class="space-y-8">
    <div>
      <h1 class="font-['Syne',sans-serif] text-3xl font-extrabold tracking-tight text-stone-900">
        {t("system_admin.settings.title")}
      </h1>
      <p class="mt-2 max-w-2xl text-stone-500">
        {t("system_admin.settings.subtitle")}
      </p>
    </div>

    <div
      class="flex flex-col gap-4 rounded-2xl border border-stone-200/60 bg-stone-50 p-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-start gap-4 text-stone-600">
        <div class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm sm:flex">
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
            ><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path
              d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"
            /><path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3" /><path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5" /></svg
          >
        </div>
        <div>
          <h4 class="text-sm font-bold text-stone-900">{t("system_admin.settings.quick_setup")}</h4>
          <p class="text-xs text-stone-500">{t("system_admin.settings.quick_setup_desc")}</p>
        </div>
      </div>
      <div class="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
        <Button
          variant="secondary"
          outline
          onclick={handleSeed}
          class="w-full border-stone-200 text-stone-600 sm:w-auto"
        >
          {t("system_admin.settings.btn_load_def")}
        </Button>
        <Button
          variant="primary"
          onclick={(e: any) => handleSubmit(e)}
          disabled={mutation.isPending}
          class="w-full sm:w-auto"
        >
          {#if mutation.isPending}
            <svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {t("common.processing")}
          {:else}
            {t("common.save_changes")}
          {/if}
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <!-- Order Settings -->
      <section
        class="space-y-6 rounded-3xl border border-stone-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md"
      >
        <div class="flex items-center gap-3 border-b border-stone-100 pb-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
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
              ><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path
                d="M16 10a4 4 0 0 1-8 0"
              /></svg
            >
          </div>
          <h3 class="text-lg font-bold text-stone-900">{t("system_admin.settings.order_settings")}</h3>
        </div>

        <div class="space-y-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <label for="preorderOnly" class="text-sm font-bold text-stone-700"
                >{t("system_admin.settings.preorder_only")}</label
              >
              <p class="text-[11px] text-stone-400">{t("system_admin.settings.preorder_only_desc")}</p>
            </div>
            <input
              id="preorderOnly"
              type="checkbox"
              bind:checked={preorderOnly}
              class="h-5 w-5 rounded border-stone-300 text-[#c48a3a] focus:ring-[#c48a3a]"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <TextInput
              label={t("system_admin.settings.lead_time")}
              type="number"
              bind:value={leadTimeHours}
              suffix="Hours"
            />
            <TextInput label={t("system_admin.settings.cutoff_time")} type="time" bind:value={cutoffTime} />
          </div>

          <div class="flex items-center justify-between gap-4">
            <div>
              <label for="sameDayEnabled" class="text-sm font-bold text-stone-700"
                >{t("system_admin.settings.same_day")}</label
              >
              <p class="text-[11px] text-stone-400">{t("system_admin.settings.same_day_desc")}</p>
            </div>
            <input
              id="sameDayEnabled"
              type="checkbox"
              bind:checked={sameDayEnabled}
              class="h-5 w-5 rounded border-stone-300 text-[#c48a3a] focus:ring-[#c48a3a]"
            />
          </div>

          <TextInput
            label={t("system_admin.settings.available_days")}
            bind:value={availableDays}
            placeholder="Monday, Tuesday, ..."
          />
        </div>
      </section>

      <!-- Delivery Settings -->
      <section
        class="space-y-6 rounded-3xl border border-stone-200/60 bg-white p-8 shadow-sm transition-all hover:shadow-md"
      >
        <div class="flex items-center gap-3 border-b border-stone-100 pb-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
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
              ><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7h18" /><path
                d="M3 12h18"
              /><path d="M3 17h18" /></svg
            >
          </div>
          <h3 class="text-lg font-bold text-stone-900">{t("system_admin.settings.delivery_settings")}</h3>
        </div>

        <div class="space-y-6">
          <TextInput label={t("system_admin.settings.province")} bind:value={deliveryProvince} />
          <TextInput
            label={t("system_admin.settings.free_delivery_min")}
            type="number"
            bind:value={freeDeliveryThreshold}
            prefix={t("common.currency_symbol")}
          />
        </div>
      </section>
    </div>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
