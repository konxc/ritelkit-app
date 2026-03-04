<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import type { Category } from "../../../lib/types";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import Fab from "../ui/Fab.svelte";

  type CategoryMutationInput = {
    name: string;
    slug: string;
    isActive: number;
    sortOrder?: number;
  };

  let { rows: initialRows = [] }: { rows?: Category[] } = $props();

  const queryClient = useQueryClient();
  let toastRef = $state<ToastNotification>();
  let newName = $state("");
  let newSlug = $state("");
  let isSubmitting = $state(false);
  let processingId = $state<string | null>(null);
  let isDrawerOpen = $state(false);

  const categoriesQuery = createQuery(() => ({
    queryKey: ["categories.list"],
    queryFn: () => trpc.categories.list.query(),
    initialData: initialRows.length > 0 ? initialRows : undefined,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  }));

  let categories = $derived((categoriesQuery.data as Category[]) || initialRows);

  $effect(() => {
    if (newName) {
      newSlug = newName
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
    }
  });

  const categoryFormHandler = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const payload: CategoryMutationInput = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      sortOrder: Number(formData.get("sort_order") || 0),
      isActive: formData.get("isActive") === "true" ? 1 : 0,
    };

    isSubmitting = true;
    try {
      await trpc.categories.create.mutate(payload);
      queryClient.invalidateQueries({ queryKey: ["categories.list"] });
      toastRef?.show("Kategori ditambahkan", "success");
      form.reset();
      newName = "";
      newSlug = "";
      isDrawerOpen = false;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Gagal menambah kategori";
      toastRef?.show(message, "error");
    } finally {
      isSubmitting = false;
    }
  };

  const handleRowAction = async (id: string, action: "save" | "delete", rowEl: HTMLElement | null) => {
    if (action === "delete") {
      if (!confirm("Hapus kategori ini?")) return;
      processingId = id;
      try {
        await trpc.categories.delete.mutate(id);
        queryClient.invalidateQueries({ queryKey: ["categories.list"] });
        toastRef?.show("Kategori dihapus", "success");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menghapus kategori";
        toastRef?.show(message, "error");
      } finally {
        processingId = null;
      }
      return;
    }

    if (action === "save") {
      const el = rowEl;
      if (!el) return;
      const payload: Record<string, string | number> = {};
      el.querySelectorAll("[data-field]").forEach((cell) => {
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

      processingId = id;
      try {
        await trpc.categories.update.mutate({
          id,
          data: payload as Partial<CategoryMutationInput>,
        });
        queryClient.invalidateQueries({ queryKey: ["categories.list"] });
        toastRef?.show("Kategori diperbarui", "success");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal memperbarui kategori";
        toastRef?.show(message, "error");
      } finally {
        processingId = null;
      }
    }
  };
  import Drawer from "../ui/overlay/Drawer.svelte";
</script>

<div class="mt-2 mb-8 flex items-center justify-between">
  <SectionHeader title="Daftar Kategori" muted="Kelola dan edit kategori produk" />
  <div class="hidden lg:block">
    <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex items-center gap-2">
      <div
        class="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:rotate-90"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
        >
      </div>
      Tambah Kategori
    </Button>
  </div>
</div>

<Fab onclick={() => (isDrawerOpen = true)} label="Tambah Kategori" />

{#snippet categoryIcon()}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    ><path d="m7.5 4.27 9 5.15" /><path
      d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
    /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg
  >
{/snippet}

{#snippet drawerFooter()}
  <div class="flex items-center gap-3">
    <button
      type="button"
      class="h-11 flex-1 rounded-2xl border border-stone-200 bg-white text-[0.7rem] font-black tracking-widest text-stone-400 uppercase transition-all hover:bg-stone-50 hover:text-stone-600 focus:outline-none active:scale-95 lg:h-[52px]"
      onclick={() => (isDrawerOpen = false)}
    >
      Batalkan
    </button>
    <Button
      type="submit"
      form="category-form"
      variant="primary"
      class="relative flex h-11 flex-[2] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#c48a3a] px-8 py-0 font-black text-white shadow-[0_10px_30px_-10px_rgba(196,138,58,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_35px_-10px_rgba(196,138,58,0.6)] active:scale-[0.98] lg:h-[52px]"
      disabled={isSubmitting}
    >
      {#if isSubmitting}
        <div class="flex items-center gap-3">
          <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span class="text-xs">Menyimpan...</span>
        </div>
      {:else}
        <div class="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline
              points="17 21 17 13 7 13 7 21"
            /><polyline points="7 3 7 8 15 8" /></svg
          >
          <span class="text-[0.75rem] tracking-tight">SIMPAN KATEGORI</span>
        </div>
      {/if}
    </Button>
  </div>
{/snippet}

<Drawer
  bind:isOpen={isDrawerOpen}
  title="Tambah Kategori"
  subtitle="Input Data Organisasi Produk"
  icon={categoryIcon}
  footer={drawerFooter}
  maxWidth="md"
>
  <div class="flex h-full flex-col px-5 py-6 lg:px-7 lg:py-8">
    <CrudInlineForm id="category-form" onsubmit={categoryFormHandler} {isSubmitting} className="flex h-full flex-col">
      <div class="flex flex-1 flex-col space-y-6 lg:space-y-8">
        <div class="space-y-1.5">
          <div class="mb-1 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-stone-400"
              ><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" /><path
                d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"
              /></svg
            >
            <label for="name" class="text-[0.8rem] font-bold text-stone-600">Nama Kategori</label>
          </div>
          <TextInput
            name="name"
            id="name"
            required
            bind:value={newName}
            placeholder="Masukkan Nama Kategori (misal: Roti Asin)..."
            class="ring-stone-100/50"
          />
          <p class="mt-1 px-1 text-[0.65rem] font-medium text-stone-400 italic">
            Gunakan nama yang jelas untuk mempermudah navigasi pembeli.
          </p>
        </div>

        <div class="space-y-1.5">
          <div class="mb-1 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-stone-400"
              ><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path
                d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
              /></svg
            >
            <label for="slug" class="text-[0.8rem] font-bold text-stone-600">URL Slug (Otomatis)</label>
          </div>
          <TextInput
            name="slug"
            id="slug"
            bind:value={newSlug}
            placeholder="roti-asin (terisi otomatis)"
            class="bg-stone-50/50 font-mono text-[0.85rem] ring-stone-100/50"
          />
        </div>

        <div class="flex gap-4">
          <div class="flex-1 space-y-1.5">
            <div class="mb-1 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-stone-400"
                ><path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" /></svg
              >
              <label for="sort_order" class="text-[0.8rem] font-bold text-stone-600">Urutan</label>
            </div>
            <TextInput
              name="sort_order"
              id="sort_order"
              type="number"
              value={0}
              placeholder="0-99"
              class="text-center tabular-nums ring-stone-100/50"
            />
          </div>
          <div class="flex-[2] space-y-1.5">
            <div class="mb-1 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-stone-400"
                ><path
                  d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"
                /><circle cx="12" cy="12" r="3" /></svg
              >
              <label for="isActive" class="text-[0.8rem] font-bold text-stone-600">Visibilitas</label>
            </div>
            <SelectInput
              name="isActive"
              id="isActive"
              placeholder="-- Pilih Status --"
              options={[
                { label: "🟢 Aktif", value: "true" },
                { label: "🔴 Draft", value: "false" },
              ]}
              class="ring-stone-100/50"
            />
          </div>
        </div>

        <div class="rounded-2xl border border-[#c48a3a]/10 bg-[#c48a3a]/5 p-5 text-[#865d25]">
          <div class="flex gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="mt-1 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg
            >
            <div>
              <h4 class="text-[0.75rem] font-black tracking-wider uppercase">Tips Navigasi</h4>
              <p class="mt-1 text-[0.8rem] leading-relaxed font-medium">
                Kategori ini akan tampil sebagai filter utama di halaman menu pembeli. Pastikan **Urutan** diisi (angka
                1 = tampil paling awal).
              </p>
            </div>
          </div>
        </div>
      </div>
    </CrudInlineForm>
  </div>
</Drawer>

<Table headers={["Kategori", { label: "URL Slug", class: "hidden lg:table-cell" }, "Urut", "Status", "Aksi"]}>
  {#if categories.length === 0}
    <TableRow>
      <TableCell colspan={5} class="py-12">
        <div class="flex flex-col items-center justify-center text-center">
          <div
            class="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-stone-100 bg-stone-50 text-stone-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
              /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg
            >
          </div>
          <p class="mb-1 text-sm font-bold text-stone-900">Daftar Kategori Kosong</p>
          <p class="max-w-[200px] text-xs text-stone-500">
            Belum ada kategori yang dibuat. Gunakan form di atas untuk menambahkannya.
          </p>
        </div>
      </TableCell>
    </TableRow>
  {/if}
  {#each categories as row (row.id)}
    <TableRow
      data-id={row.id}
      class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50"
    >
      <TableCell class="py-4">
        <div class="flex flex-col gap-1">
          <div
            contenteditable="true"
            role="textbox"
            tabindex="0"
            aria-label="Nama Kategori"
            data-field="name"
            class="inline-block min-w-[120px] rounded-lg border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 font-bold text-stone-900 transition-all outline-none hover:border-[#c48a3a]/30 hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
          >
            {row.name}
          </div>
          <div class="font-mono text-[0.65rem] text-stone-400 lg:hidden">/{row.slug}</div>
        </div>
      </TableCell>
      <TableCell class="hidden py-4 lg:table-cell">
        <div
          contenteditable="true"
          role="textbox"
          tabindex="0"
          aria-label="URL Slug"
          data-field="slug"
          class="inline-block min-w-[120px] rounded-lg border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 font-mono text-[0.8rem] text-stone-500 transition-all outline-none hover:border-[#c48a3a]/30 hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
        >
          {row.slug || ""}
        </div>
      </TableCell>
      <TableCell class="py-4">
        <div
          contenteditable="true"
          role="textbox"
          tabindex="0"
          aria-label="Urutan"
          data-field="sortOrder"
          class="inline-block w-16 rounded-lg border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 text-left font-bold text-stone-600 tabular-nums transition-all outline-none hover:border-[#c48a3a]/30 hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
        >
          {row.sortOrder}
        </div>
      </TableCell>
      <TableCell class="py-4">
        <select
          data-field="isActive"
          class="cursor-pointer rounded-lg border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 text-[0.7rem] font-bold tracking-wider text-stone-700 uppercase transition-all outline-none hover:border-[#c48a3a]/30 hover:bg-white focus:bg-white"
        >
          <option value="true" selected={row.isActive === 1}>🟢 AKTIF</option>
          <option value="false" selected={row.isActive === 0}>🔴 DRAF</option>
        </select>
      </TableCell>
      <TableCell align="center" class="py-4">
        <div class="flex items-center justify-center">
          <RowActions
            isSaving={processingId === row.id}
            isDeleting={processingId === row.id}
            onSave={(e) => handleRowAction(row.id, "save", e.currentTarget.closest("tr")!)}
            onDelete={() => handleRowAction(row.id, "delete", null)}
          />
        </div>
      </TableCell>
    </TableRow>
  {/each}
</Table>

<ToastNotification bind:this={toastRef} />
