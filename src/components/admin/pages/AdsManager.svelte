<script module lang="ts">
  export type AdRow = {
    id: string | number;
    name: string;
    channel: string;
    budget: number;
    spend: number;
    status: string;
  };
</script>

<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { trpc } from "../../../lib/trpc";
  import {
    createQuery,
    createMutation,
    useQueryClient,
  } from "@tanstack/svelte-query";

  let { rows: initialRows = [] }: { rows: any[] } = $props();

  const queryClient = useQueryClient();
  let toastRef = $state<ToastNotification>();

  const adsQuery = createQuery({
    queryKey: ["ads"],
    queryFn: () => trpc.ads.list.query(),
    initialData: () => initialRows,
  });

  const createAdMutation = createMutation({
    mutationFn: (data: any) => trpc.ads.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toastRef?.show("Campaign berhasil dibuat!", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const updateAdMutation = createMutation({
    mutationFn: (payload: { id: string; data: any }) =>
      trpc.ads.update.mutate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toastRef?.show("Campaign diperbarui", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const deleteAdMutation = createMutation({
    mutationFn: (id: string) => trpc.ads.delete.mutate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toastRef?.show("Campaign dihapus", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    createAdMutation.mutate({
      name: data.get("name") as string,
      channel: data.get("channel") as string,
      budget: Number(data.get("budget")),
      spend: 0,
      status: data.get("status") as any,
      startAt: (data.get("start_at") as string) || null,
      endAt: (data.get("end_at") as string) || null,
      notes: (data.get("notes") as string) || null,
    });
    form.reset();
  };

  const handleRowAction = (
    id: string,
    action: string,
    rowElement: HTMLElement | null,
  ) => {
    if (action === "delete") {
      if (confirm("Hapus campaign ini?")) {
        deleteAdMutation.mutate(id);
      }
    } else if (action === "save" && rowElement) {
      const fields: Record<string, any> = {};
      rowElement.querySelectorAll("[data-field]").forEach((el) => {
        const field = el.getAttribute("data-field")!;
        if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
          fields[field] = el.value;
        } else {
          fields[field] = el.textContent?.trim();
        }
      });

      const data = {
        name: fields.name,
        channel: fields.channel,
        budget: Number(fields.budget) || 0,
        spend: Number(fields.spend) || 0,
        status: fields.status as any,
      };

      updateAdMutation.mutate({ id, data });
    }
  };

  const currentAds = $derived($adsQuery.data || initialRows);
</script>

<SectionHeader title="Buat Campaign" badge="Ads" />
<CrudInlineForm
  id="ads-form"
  on:submit={handleCreate}
  isSubmitting={createAdMutation.isPending}
>
  <div class="space-y-6 border-b border-stone-100 pb-8 mb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="space-y-1.5">
        <label
          for="name"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Nama Campaign</label
        >
        <input
          id="name"
          name="name"
          required
          placeholder="Cth: Promo Ramadhan"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="channel"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Channel / Platform</label
        >
        <input
          id="channel"
          name="channel"
          placeholder="IG / FB / Google Ads"
          required
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="budget"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Budget Total (Rp)</label
        >
        <input
          id="budget"
          name="budget"
          type="number"
          required
          placeholder="0"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold tabular-nums"
        />
      </div>
      <div class="space-y-1.5">
        <label
          for="status"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Status Awal</label
        >
        <select
          id="status"
          name="status"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none appearance-none cursor-pointer font-medium"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
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
          >Tanggal Selesai</label
        >
        <input
          id="end_at"
          name="end_at"
          type="date"
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
      <div class="space-y-1.5 col-span-1 md:col-span-2">
        <label
          for="notes"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Catatan Campaign</label
        >
        <input
          id="notes"
          name="notes"
          placeholder="Tujuan campaign, link kreatif, dll..."
          class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
        />
      </div>
    </div>
  </div>
  <div class="flex items-end mt-4">
    <button
      class="flex items-center justify-center gap-3 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto mt-auto"
      type="submit"
      disabled={createAdMutation.isPending}
    >
      {#if createAdMutation.isPending}
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
      Luncurkan Campaign
    </button>
  </div>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Campaign" />
</div>

<AdminDataTable>
  <thead>
    <tr>
      <th>Nama</th>
      <th>Channel</th>
      <th>Budget</th>
      <th>Spend</th>
      <th>Status</th>
      <th>Aksi</th>
    </tr>
  </thead>
  <tbody>
    {#if currentAds.length === 0}
      <tr>
        <td colspan="6" class="text-center py-12 text-stone-400 text-sm italic"
          >Belum ada campaign beriklan.</td
        >
      </tr>
    {/if}
    {#each currentAds as row (row.id)}
      <tr
        class="group hover:bg-stone-50/50 transition-colors border-b border-stone-100 last:border-0"
      >
        <td
          contenteditable="true"
          data-field="name"
          class="py-4 font-bold text-stone-900 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] px-3 py-1.5 rounded-lg border border-transparent transition-all"
          >{row.name}</td
        >
        <td
          contenteditable="true"
          data-field="channel"
          class="py-4 font-medium text-stone-500 uppercase tracking-widest text-[0.65rem] outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all"
          >{row.channel}</td
        >
        <td
          contenteditable="true"
          data-field="budget"
          class="py-4 tabular-nums font-bold text-stone-800 outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all w-32 text-center text-sm"
          >{row.budget}</td
        >
        <td
          contenteditable="true"
          data-field="spend"
          class="py-4 tabular-nums font-bold text-rose-600 outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all w-32 text-center text-sm"
          >{row.spend}</td
        >
        <td class="py-4">
          <select
            data-field="status"
            class="px-3 py-1.5 rounded-lg border border-transparent hover:bg-white focus:bg-white transition-all bg-transparent text-xs font-bold uppercase cursor-pointer outline-none"
          >
            <option value="draft" selected={row.status === "draft"}
              >Draft</option
            >
            <option value="active" selected={row.status === "active"}
              >🟢 Active</option
            >
            <option value="paused" selected={row.status === "paused"}
              >🟡 Paused</option
            >
            <option value="completed" selected={row.status === "completed"}
              >⚪ Completed</option
            >
          </select>
        </td>
        <td class="py-4">
          <RowActions
            isSaving={updateAdMutation.isPending &&
              updateAdMutation.variables?.id === row.id}
            isDeleting={deleteAdMutation.isPending &&
              deleteAdMutation.variables === row.id}
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
