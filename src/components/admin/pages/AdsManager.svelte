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
	import AdminDataTable from "../AdminDataTable.svelte";
	import CrudInlineForm from "../CrudInlineForm.svelte";
	import RowActions from "../RowActions.svelte";
	import SectionHeader from "../SectionHeader.svelte";
	import ToastNotification from "../ToastNotification.svelte";

	let { rows: initialRows = [] }: { rows: AdRow[] } = $props();

	let toastRef = $state<ToastNotification>();
	let isSubmitting = $state(false);
	let savingId = $state<string | null>(null);
	let deletingId = $state<string | null>(null);

	const queryClient = useQueryClient();

	const adsQuery = createQuery(() => ({
		queryKey: ["ads.list"],
		queryFn: () => trpc.ads.list.query(),
		initialData:
		initialRows.length > 0
			? initialRows
			: undefined,
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
			toastRef?.show("Campaign berhasil dibuat!", "success");
			form.reset();
			queryClient.invalidateQueries({ queryKey: ["ads.list"] });
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Gagal membuat campaign";
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
			if (confirm("Hapus campaign ini?")) {
				deletingId = resolvedId;
				try {
					await trpc.ads.delete.mutate(resolvedId);
					toastRef?.show("Campaign dihapus", "success");
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
				toastRef?.show("Campaign diperbarui", "success");
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
<div in:fly={{ y: 20, duration: 400, delay: 100 }}>
<SectionHeader title="Buat Campaign" badge="Ads" />
<CrudInlineForm id="ads-form" onsubmit={handleCreate} {isSubmitting}>
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
		{#if rows.length === 0}
			<tr>
				<td colspan="6" class="text-center py-12 text-stone-400 text-sm italic"
					>Belum ada campaign beriklan.</td
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
						<option value="draft" selected={row.status === "draft"}>Draft</option>
						<option value="active" selected={row.status === "active"}>🟢 Active</option>
						<option value="paused" selected={row.status === "paused"}>🟡 Paused</option>
						<option value="completed" selected={row.status === "completed"}>⚪ Completed</option>
					</select>
				</td>
				<td class="py-4">
					<RowActions
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
