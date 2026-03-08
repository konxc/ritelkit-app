<script module lang="ts">
export type AdRow = {
  id: string | number;
  name: string;
  channel: string;
  budget: number;
  spend: number;
  status: string;
};

type AdStatus = "draft" | "active" | "paused" | "completed";

type AdMutationInput = {
  name: string;
  channel: string;
  budget: number;
  spend: number;
  status: AdStatus;
  startAt?: string | null;
  endAt?: string | null;
  notes?: string | null;
};
</script>

<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { fade, fly } from "svelte/transition";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import EmptyState from "../ui/EmptyState.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";

  let { rows: initialRows = [] }: { rows: AdRow[] } = $props();

  let toastRef = $state<ToastNotification>();
  let isSubmitting = $state(false);
  let savingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);

  const queryClient = useQueryClient();

  const adsQuery = createQuery(() => ({
    queryKey: ["ads.list"],
    queryFn: () => trpc.ads.list.query(),
    initialData: initialRows.length > 0 ? initialRows : undefined,
    refetchOnMount: false,
  }));

  let rows = $derived(adsQuery.data ?? initialRows);

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const data: AdMutationInput = {
      name: formData.get("name") as string,
      channel: formData.get("channel") as string,
      budget: Number(formData.get("budget")),
      spend: 0,
      status: (formData.get("status") || "draft") as AdStatus,
      startAt: (formData.get("start_at") as string) || null,
      endAt: (formData.get("end_at") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    isSubmitting = true;
    try {
      await trpc.ads.create.mutate(data);
      toastRef?.show("Kampanye berhasil dibuat!", "success");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["ads.list"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Gagal membuat campaign";
      toastRef?.show(message, "error");
    } finally {
      isSubmitting = false;
    }
  };

  const handleRowAction = async (id: string | number, action: string, rowElement: HTMLElement | null) => {
    const resolvedId = String(id);
    if (action === "delete") {
      if (confirm("Hapus campaign ini?")) {
        deletingId = resolvedId;
        try {
          await trpc.ads.delete.mutate(resolvedId);
          toastRef?.show("Kampanye dihapus", "success");
          queryClient.invalidateQueries({ queryKey: ["ads.list"] });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Gagal menghapus campaign";
          toastRef?.show(message, "error");
        } finally {
          deletingId = null;
        }
      }
    } else if (action === "save" && rowElement) {
      const fields: Record<string, string> = {};
      rowElement.querySelectorAll("[data-field]").forEach((el) => {
        const field = el.getAttribute("data-field")!;
        if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
          fields[field] = el.value;
        } else {
          fields[field] = el.textContent?.trim() || "";
        }
      });

      const data: AdMutationInput = {
        name: fields.name,
        channel: fields.channel,
        budget: Number(fields.budget) || 0,
        spend: Number(fields.spend) || 0,
        status: (fields.status || "draft") as AdStatus,
      };

      savingId = resolvedId;
      try {
        await trpc.ads.update.mutate({ id: resolvedId, data });
        toastRef?.show("Kampanye diperbarui", "success");
        queryClient.invalidateQueries({ queryKey: ["ads.list"] });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal memperbarui campaign";
        toastRef?.show(message, "error");
      } finally {
        savingId = null;
      }
    }
  };
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <SectionHeader title="Buat Kampanye" badge="Iklan" />
    <CrudInlineForm id="ads-form" onsubmit={handleCreate} {isSubmitting}>
      <div class="mb-8 space-y-6 border-b border-stone-100 pb-8">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <TextInput
              id="name"
              name="name"
              label="Nama Kampanye"
              required
              placeholder="Cth: Promo Ramadhan"
              class="font-bold"
            />
          </div>
          <div>
            <TextInput
              id="channel"
              name="channel"
              label="Channel / Platform"
              placeholder="IG / FB / Google Ads"
              required
            />
          </div>
          <div>
            <TextInput
              id="budget"
              name="budget"
              type="number"
              label="Budget Total (Rp)"
              required
              placeholder="0"
              class="font-bold tabular-nums"
            />
          </div>
          <div>
            <SelectInput
              id="status"
              name="status"
              label="Status Awal"
              options={[
                { value: "draft", label: "Draft" },
                { value: "active", label: "Active" },
                { value: "paused", label: "Paused" },
                { value: "completed", label: "Completed" },
              ]}
            />
          </div>
          <div>
            <TextInput id="start_at" name="start_at" type="date" label="Tanggal Mulai" />
          </div>
          <div>
            <TextInput id="end_at" name="end_at" type="date" label="Tanggal Selesai" />
          </div>
          <div class="col-span-1 md:col-span-2">
            <TextInput
              id="notes"
              name="notes"
              label="Catatan Kampanye"
              placeholder="Tujuan campaign, link kreatif, dll..."
            />
          </div>
        </div>
      </div>
      <div class="mt-4 flex items-end">
        <Button type="submit" variant="primary" class="mt-auto h-[42px] w-full px-8 md:w-auto" disabled={isSubmitting}>
          {#if isSubmitting}
            <svg
              class="mr-2 -ml-1 inline-block h-4 w-4 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path></svg
            >
          {/if}
          Luncurkan Kampanye
        </Button>
      </div>
    </CrudInlineForm>

    <div class="mt-6">
      <SectionHeader title="Daftar Kampanye" />
    </div>

    <Table headers={["Nama", "Channel", "Budget", "Spend", "Status", "Aksi"]}>
      {#if rows.length === 0}
        <TableRow>
          <TableCell colspan={6} class="border-0 p-0">
            <EmptyState
              title="Belum Ada Kampanye"
              description="Belum ada campaign beriklan berjalan."
              class="!rounded-none !border-0 !bg-transparent py-16 !shadow-none"
            />
          </TableCell>
        </TableRow>
      {/if}

      {#each rows as row (row.id)}
        <TableRow class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="name"
              class="rounded-lg border border-transparent px-3 py-1.5 font-bold text-stone-900 transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
            >
              {row.name}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="channel"
              class="rounded-lg px-3 py-1.5 text-[0.65rem] font-medium tracking-widest text-stone-500 uppercase transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.channel}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="budget"
              class="w-32 rounded-lg px-3 py-1.5 text-center text-sm font-bold text-stone-800 tabular-nums transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.budget}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="spend"
              class="w-32 rounded-lg px-3 py-1.5 text-center text-sm font-bold text-rose-600 tabular-nums transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.spend}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <select
              data-field="status"
              class="cursor-pointer rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-xs font-bold uppercase transition-all outline-none hover:bg-white focus:bg-white"
            >
              <option value="draft" selected={row.status === "draft"}>Draft</option>
              <option value="active" selected={row.status === "active"}>🟢 Active</option>
              <option value="paused" selected={row.status === "paused"}>🟡 Paused</option>
              <option value="completed" selected={row.status === "completed"}>⚪ Completed</option>
            </select>
          </TableCell>
          <TableCell class="py-4">
            <RowActions
              isSaving={savingId === row.id}
              isDeleting={deletingId === row.id}
              onSave={(e) => handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
              onDelete={() => handleRowAction(row.id, "delete", null)}
            />
          </TableCell>
        </TableRow>
      {/each}
    </Table>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
