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
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import RowActions from "../RowActions.svelte";
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

  const customersQuery = createQuery({
    queryKey: ["customers"],
    queryFn: () => trpc.customers.list.query(),
    initialData: () => initialRows,
  });

  const createCustomerMutation = createMutation({
    mutationFn: (data: any) => trpc.customers.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toastRef?.show("Pelanggan berhasil ditambahkan!", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const updateCustomerMutation = createMutation({
    mutationFn: (payload: { id: string; data: any }) =>
      trpc.customers.update.mutate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toastRef?.show("Pelanggan diperbarui", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const deleteCustomerMutation = createMutation({
    mutationFn: (id: string) => trpc.customers.delete.mutate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toastRef?.show("Pelanggan dihapus", "success");
    },
    onError: (err: any) => toastRef?.show(err.message, "error"),
  });

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    createCustomerMutation.mutate({
      name: data.get("name") as string,
      phone: data.get("phone") as string,
      email: (data.get("email") as string) || null,
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
      if (confirm("Hapus pelanggan ini?")) {
        deleteCustomerMutation.mutate(id);
      }
    } else if (action === "save" && rowElement) {
      const fields: Record<string, any> = {};
      rowElement.querySelectorAll("[data-field]").forEach((el) => {
        const field = el.getAttribute("data-field")!;
        if (el instanceof HTMLInputElement) {
          fields[field] = el.value;
        } else {
          fields[field] = el.textContent?.trim();
        }
      });

      const data = {
        name: fields.name,
        phone: fields.phone,
        email: fields.email === "-" ? null : fields.email,
        notes: fields.notes === "-" ? null : fields.notes,
      };

      updateCustomerMutation.mutate({ id, data });
    }
  };

  const currentCustomers = $derived($customersQuery.data || initialRows);
</script>

<SectionHeader title="Tambah Pelanggan" badge="CRM" />
<CrudInlineForm
  id="customer-form"
  on:submit={handleCreate}
  isSubmitting={createCustomerMutation.isPending}
>
  <div
    class="flex flex-col md:flex-row flex-wrap gap-4 xl:gap-6 items-end pb-8 border-b border-stone-100 mb-8 w-full"
  >
    <div class="space-y-1.5 w-full md:w-64">
      <label
        for="name"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Nama Lengkap</label
      >
      <input
        id="name"
        name="name"
        required
        placeholder="Cth: Budi Santoso"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-bold"
      />
    </div>
    <div class="space-y-1.5 w-full md:w-48">
      <label
        for="phone"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >No. WhatsApp</label
      >
      <input
        id="phone"
        name="phone"
        required
        placeholder="0812..."
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none font-mono"
      />
    </div>
    <div class="space-y-1.5 w-full md:w-64">
      <label
        for="email"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Email (Opsional)</label
      >
      <input
        id="email"
        name="email"
        type="email"
        placeholder="budi@email.com"
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
      />
    </div>
    <div class="space-y-1.5 w-full md:flex-1">
      <label
        for="notes"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Catatan</label
      >
      <input
        id="notes"
        name="notes"
        placeholder="Info tambahan pelanggan..."
        class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm outline-none"
      />
    </div>
    <button
      class="flex items-center justify-center gap-3 h-[42px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
      type="submit"
      disabled={createCustomerMutation.isPending}
    >
      {#if createCustomerMutation.isPending}
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
      Tambah Data
    </button>
  </div>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Pelanggan" muted="Cari detail lalu klik" />
</div>

<AdminDataTable>
  <thead>
    <tr>
      <th>Nama</th>
      <th>Telepon</th>
      <th>Email</th>
      <th>Catatan</th>
      <th>Aksi</th>
    </tr>
  </thead>
  <tbody>
    {#if currentCustomers.length === 0}
      <tr>
        <td colspan="5" class="text-center py-12 text-stone-400 text-sm italic"
          >Belum ada data pelanggan.</td
        >
      </tr>
    {/if}
    {#each currentCustomers as row (row.id)}
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
          data-field="phone"
          class="py-4 font-mono text-[#c48a3a] font-bold outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all"
          >{row.phone}</td
        >
        <td
          contenteditable="true"
          data-field="email"
          class="py-4 text-stone-600 outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all"
          >{row.email || "-"}</td
        >
        <td
          contenteditable="true"
          data-field="notes"
          class="py-4 text-stone-500 text-sm italic outline-none hover:bg-white focus:bg-white px-3 py-1.5 rounded-lg transition-all"
          >{row.notes || "-"}</td
        >
        <td class="py-4">
          <RowActions
            detailHref={`/admin/customers/${row.id}`}
            isSaving={updateCustomerMutation.isPending &&
              updateCustomerMutation.variables?.id === row.id}
            isDeleting={deleteCustomerMutation.isPending &&
              deleteCustomerMutation.variables === row.id}
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
