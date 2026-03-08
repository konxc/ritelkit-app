<script module lang="ts">
export type CustomerRow = {
  id: string | number;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
};
</script>

<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { fade, fly } from "svelte/transition";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import RowActions from "../RowActions.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";

  type CustomerMutationInput = {
    name: string;
    phone: string;
    email?: string | null;
    notes?: string | null;
  };

  let {
    initialRows = [],
    total: initialTotal = 0,
    q = "",
    page = 1,
    limit = 20,
  }: {
    initialRows?: CustomerRow[];
    total?: number;
    q?: string;
    page?: number;
    limit?: number;
  } = $props();

  const offset = $derived((page - 1) * limit);
  const queryClient = useQueryClient();

  let toastRef = $state<ToastNotification>();
  let isSubmitting = $state(false);

  const customersQuery = createQuery(() => ({
    queryKey: ["customers.list"],
    queryFn: () => trpc.customers.list.query(),
    initialData: initialRows.length > 0 ? initialRows : undefined,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  }));

  let rows = $derived((customersQuery.data as CustomerRow[]) || initialRows);
  let total = $derived(rows.length || initialTotal);
  let isFetching = $derived(customersQuery.isFetching);

  let savingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const data: CustomerMutationInput = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: (formData.get("email") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    isSubmitting = true;
    try {
      await trpc.customers.create.mutate(data);
      toastRef?.show("Pelanggan berhasil ditambahkan!", "success");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["customers.list"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add customer";
      toastRef?.show(message, "error");
    } finally {
      isSubmitting = false;
    }
  };

  const handleRowAction = async (id: string | number, action: string, rowElement: HTMLElement | null) => {
    const resolvedId = String(id);
    if (action === "delete") {
      if (confirm("Hapus pelanggan ini?")) {
        deletingId = resolvedId;
        try {
          await trpc.customers.delete.mutate(resolvedId);
          toastRef?.show("Pelanggan dihapus", "success");
          queryClient.invalidateQueries({
            queryKey: ["customers.list"],
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to delete customer";
          toastRef?.show(message, "error");
        } finally {
          deletingId = null;
        }
      }
    } else if (action === "save" && rowElement) {
      const fields: Record<string, string> = {};
      rowElement.querySelectorAll("[data-field]").forEach((el) => {
        const field = el.getAttribute("data-field")!;
        if (el instanceof HTMLInputElement) {
          fields[field] = el.value;
        } else {
          fields[field] = el.textContent?.trim() || "";
        }
      });

      const data: CustomerMutationInput = {
        name: fields.name,
        phone: fields.phone,
        email: fields.email || null,
        notes: fields.notes || null,
      };

      savingId = resolvedId;
      try {
        await trpc.customers.update.mutate({ id: resolvedId, data });
        toastRef?.show("Data pelanggan diperbarui!", "success");
        queryClient.invalidateQueries({ queryKey: ["customers.list"] });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to update customer";
        toastRef?.show(message, "error");
      } finally {
        savingId = null;
      }
    }
  };
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <SectionHeader title="Tambah Pelanggan" badge="CRM" />
    <CrudInlineForm id="customer-form" onsubmit={handleCreate} {isSubmitting}>
      <div
        class="mb-8 flex w-full flex-col flex-wrap items-end gap-4 border-b border-stone-100 pb-8 md:flex-row xl:gap-6"
      >
        <div class="w-full md:w-64">
          <TextInput
            id="name"
            name="name"
            label="Nama Lengkap"
            required
            placeholder="Cth: Budi Santoso"
            class="font-bold"
          />
        </div>
        <div class="w-full md:w-48">
          <TextInput id="phone" name="phone" label="No. WhatsApp" required placeholder="0812..." class="font-mono" />
        </div>
        <div class="w-full md:w-64">
          <TextInput id="email" name="email" type="email" label="Email (Opsional)" placeholder="budi@email.com" />
        </div>
        <div class="w-full md:flex-1">
          <TextInput id="notes" name="notes" label="Catatan" placeholder="Informasi tambahan pelanggan..." />
        </div>
        <Button type="submit" variant="primary" class="h-[42px] w-full px-8 md:w-auto" disabled={isSubmitting}>
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
          Tambah Data
        </Button>
      </div>
    </CrudInlineForm>

    <div class="mt-6">
      <SectionHeader title="Daftar Pelanggan" muted="Cari detail lalu klik" />
    </div>

    <Table headers={["Nama", "Telepon", "Email", "Catatan", "Aksi"]}>
      {#if rows.length === 0}
        <TableRow>
          <TableCell colspan={5} class="py-12 text-center text-sm text-stone-400 italic"
            >Belum ada data pelanggan.</TableCell
          >
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
              data-field="phone"
              class="rounded-lg px-3 py-1.5 font-mono font-bold text-[#c48a3a] transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.phone}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="email"
              class="rounded-lg px-3 py-1.5 text-stone-600 transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.email || "-"}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="notes"
              class="rounded-lg px-3 py-1.5 text-sm text-stone-500 italic transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.notes || "-"}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <RowActions
              detailHref={`/admin/customers/${row.id}`}
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
