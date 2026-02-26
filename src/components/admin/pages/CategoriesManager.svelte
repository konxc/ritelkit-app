<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import { onMount } from "svelte";
  import { trpc } from "../../../lib/trpc";
  import {
    createQuery,
    createMutation,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import type { Category } from "../../../lib/types";

  let { rows: initialRows = [] }: { rows: Category[] } = $props();

  const queryClient = useQueryClient();
  let csrfToken = "";
  let toastRef: ToastNotification;

  const categoriesQuery = createQuery({
    queryKey: ["categories"],
    queryFn: () => trpc.categories.list.query(),
    initialData: () => initialRows as any,
  });

  const createMutationFn = createMutation({
    mutationFn: (data: any) => trpc.categories.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toastRef?.show("Kategori ditambahkan", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const updateMutation = createMutation({
    mutationFn: (payload: { id: string; data: any }) =>
      trpc.categories.update.mutate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toastRef?.show("Kategori diperbarui", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const deleteMutation = createMutation({
    mutationFn: (id: string) => trpc.categories.delete.mutate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toastRef?.show("Kategori dihapus", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  onMount(() => {
    csrfToken =
      document
        .querySelector("meta[name='csrf-token']")
        ?.getAttribute("content") || "";
  });

  const categoryFormHandler = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const payload: any = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      sortOrder: Number(formData.get("sort_order") || 0),
      isActive: formData.get("isActive") === "true" ? 1 : 0,
    };
    createMutationFn.mutate(payload);
    form.reset();
  };

  const handleRowAction = async (
    id: string,
    action: string,
    rowEl: HTMLElement,
  ) => {
    if (action === "delete") {
      if (!confirm("Hapus kategori ini?")) return;
      deleteMutation.mutate(id);
      return;
    }

    if (action === "save") {
      const payload: any = {};
      rowEl.querySelectorAll("[data-field]").forEach((cell) => {
        const field = cell.getAttribute("data-field");
        if (!field) return;
        if (cell instanceof HTMLSelectElement) {
          payload[field] = cell.value === "true" ? 1 : 0;
        } else if (cell instanceof HTMLInputElement) {
          payload[field] = cell.value;
        } else {
          payload[field] = cell.textContent?.trim() || "";
        }
      });
      if (payload.sortOrder) payload.sortOrder = Number(payload.sortOrder);
      updateMutation.mutate({ id, data: payload });
    }
  };

  const currentRows = $derived($categoriesQuery.data || initialRows);
</script>

<SectionHeader title="Tambah Kategori" badge="Product Organization" />
<CrudInlineForm
  id="category-form"
  on:submit={categoryFormHandler}
  isSubmitting={$createMutationFn.isPending}
>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="field">
      <label
        for="name"
        class="block text-xs font-semibold text-stone-500 uppercase mb-1"
        >Nama</label
      >
      <input
        name="name"
        id="name"
        required
        placeholder="Cth: Roti Manis"
        class="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-[#c48a3a]/20"
      />
    </div>
    <div class="field">
      <label
        for="slug"
        class="block text-xs font-semibold text-stone-500 uppercase mb-1"
        >Slug</label
      >
      <input
        name="slug"
        id="slug"
        placeholder="roti-manis"
        class="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-[#c48a3a]/20"
      />
    </div>
    <div class="field">
      <label
        for="sort_order"
        class="block text-xs font-semibold text-stone-500 uppercase mb-1"
        >Urutan</label
      >
      <input
        name="sort_order"
        id="sort_order"
        type="number"
        value="0"
        class="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-[#c48a3a]/20"
      />
    </div>
    <div class="field">
      <label
        for="isActive"
        class="block text-xs font-semibold text-stone-500 uppercase mb-1"
        >Status</label
      >
      <select
        name="isActive"
        id="isActive"
        class="w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 focus:ring-[#c48a3a]/20"
      >
        <option value="true">Aktif</option>
        <option value="false">Draft</option>
      </select>
    </div>
  </div>
  <div class="flex items-end pt-4">
    <button
      class="btn-sn-primary w-full md:w-auto mt-auto h-[42px] px-8 rounded-xl bg-stone-900 text-white font-semibold disabled:opacity-50"
      type="submit"
      disabled={$createMutationFn.isPending}
    >
      {#if $createMutationFn.isPending}
        <svg class="animate-spin h-4 w-4 mr-2 inline" viewBox="0 0 24 24"
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
      Tambah Kategori
    </button>
  </div>
</CrudInlineForm>

<div class="mt-8">
  <SectionHeader title="Daftar Kategori" muted="Edit langsung di tabel" />
  <AdminDataTable>
    <thead>
      <tr>
        <th>Nama</th>
        <th>Slug</th>
        <th>Urutan</th>
        <th>Status</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#each currentRows as row (row.id)}
        <tr data-id={row.id}>
          <td
            ><div
              contenteditable="true"
              data-field="name"
              class="outline-none px-2 py-1 rounded hover:bg-stone-50"
            >
              {row.name}
            </div></td
          >
          <td
            ><div
              contenteditable="true"
              data-field="slug"
              class="outline-none px-2 py-1 rounded hover:bg-stone-50"
            >
              {row.slug || ""}
            </div></td
          >
          <td
            ><div
              contenteditable="true"
              data-field="sortOrder"
              class="outline-none px-2 py-1 rounded hover:bg-stone-50 text-center"
            >
              {row.sortOrder}
            </div></td
          >
          <td>
            <select
              data-field="isActive"
              class="outline-none bg-transparent cursor-pointer"
            >
              <option value="true" selected={row.isActive === 1}>Aktif</option>
              <option value="false" selected={row.isActive === 0}>Draft</option>
            </select>
          </td>
          <td>
            <RowActions
              isSaving={$updateMutation.isPending &&
                $updateMutation.variables?.id === row.id}
              isDeleting={$deleteMutation.isPending &&
                $deleteMutation.variables === row.id}
              onSave={(e) =>
                handleRowAction(row.id, "save", e.currentTarget.closest("tr")!)}
              onDelete={() => handleRowAction(row.id, "delete", null!)}
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>

<ToastNotification bind:this={toastRef} />
