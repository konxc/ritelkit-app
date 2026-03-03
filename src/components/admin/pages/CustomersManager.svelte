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
import AdminDataTable from "../AdminDataTable.svelte";
import CrudInlineForm from "../CrudInlineForm.svelte";
import SectionHeader from "../SectionHeader.svelte";
import RowActions from "../RowActions.svelte";
import ToastNotification from "../ToastNotification.svelte";

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
		const message = error instanceof Error ? error.message : "Gagal menambah pelanggan";
		toastRef?.show(message, "error");
	} finally {
		isSubmitting = false;
	}
};

const handleRowAction = async (
	id: string | number,
	action: string,
	rowElement: HTMLElement | null,
) => {
	const resolvedId = String(id);
	if (action === "delete") {
		if (confirm("Hapus pelanggan ini?")) {
			deletingId = resolvedId;
			try {
				await trpc.customers.delete.mutate(resolvedId);
				toastRef?.show("Pelanggan dihapus", "success");
				queryClient.invalidateQueries({ queryKey: ["customers.list"] });
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : "Gagal menghapus pelanggan";
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
			const message = error instanceof Error ? error.message : "Gagal memperbarui pelanggan";
			toastRef?.show(message, "error");
		} finally {
			savingId = null;
		}
	}
};
</script>
<div class="w-full h-full">
<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
<SectionHeader title="Tambah Pelanggan" badge="CRM" />
<CrudInlineForm id="customer-form" onsubmit={handleCreate} {isSubmitting}>
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
			disabled={isSubmitting}
		>
			{#if isSubmitting}
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
		{#if rows.length === 0}
			<tr>
				<td colspan="5" class="text-center py-12 text-stone-400 text-sm italic"
					>Belum ada data pelanggan.</td
				>
			</tr>
		{/if}
		{#each rows as row (row.id)}
			<tr
				transition:fade={{ duration: 200 }}
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
						isSaving={savingId === row.id}
						isDeleting={deletingId === row.id}
						onSave={(e) =>
							handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
						onDelete={() => handleRowAction(row.id, "delete", null)}
					/>
				</td>
			</tr>
		{/each}
	</tbody>
</AdminDataTable>
</div>

<ToastNotification bind:this={toastRef} />

</div>
