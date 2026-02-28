<script lang="ts">
	// Meniru `actions` dari astro (opsional karena ini file simulasi)
	import { fade, slide } from "svelte/transition";
	// Tidak ada query `loading state` seperti saat menunggu tRPC dan TanStack Query

	let { initialData = [] } = $props<{
		initialData?: Array<{ id: string; name: string }>;
	}>();

	// 2. RUNES: State Lokal ($state)
	// Kita menjadikan data server sebagai internal state reaktif komponen
	let items = $state<Array<{ id: string; name: string }>>([]);
	let newItemName = $state("");
	let isSubmitting = $state(false);
	let deletingId = $state<string | null>(null);

	// Inisialisasi dari props dengan efek 
	$effect(() => {
		items = initialData;
	});

	// 3. RUNES: State Turunan ($derived)
	// Mengkalkulasi jumlah item secara otomatis tanpa event tambahan
	let totalItems = $derived(items.length);

	// 4. ACTION CALL / MUTASI 
	async function handleAdd() {
		if (!newItemName.trim() || isSubmitting) return;

		isSubmitting = true;

		try {
			// [B] Simulasi Network Delay (~800ms) untuk Action Backend RPC
			await new Promise((res) => setTimeout(res, 800));

			const newDbEntry = {
				id: crypto.randomUUID(),
				name: newItemName,
			};

			// Svelte 5 akan mendeteksi `assignment` ini secara native dan merender ulang DOM.
			items = [...items, newDbEntry];

			// Reset input form
			newItemName = "";
		} catch (e) {
			console.error("Gagal saat memanggil Astro Action: ", e);
			alert("Gagal memanggil mutasi Action.");
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete(id: string) {
		deletingId = id;
		try {
			// Simulasi menghapus data di DB Astro Action
			await new Promise((res) => setTimeout(res, 500));

			// Reaktivitas langsung ter-update di UI
			items = items.filter((item) => item.id !== id);
		} finally {
			deletingId = null;
		}
	}

	function handleReset() {
		// Mengembalikan array internal kita ke data SSR awal
		items = initialData;
	}
</script>

<div class="max-w-xl bg-white border rounded-xl shadow-sm overflow-hidden">
	<div class="px-6 py-5 border-b">
		<h2 class="text-xl font-semibold tracking-tight text-slate-900">Manajemen Item (RPC Lokal)</h2>
		<p class="text-sm text-slate-500 mt-1">Contoh ini menunjukkan efisiensi Astro SSR dan Svelte 5 tanpa beban kognitif tRPC.</p>
	</div>
	
	<div class="px-6 py-5">
		<!-- Penggunaan $derived state -->
		<p class="mb-4 text-sm font-medium text-slate-700">Total data aktif dalam memory lokal (SSR + Reaktif): {totalItems}</p>

		<div class="flex items-center gap-3 mb-6">
			<!-- Two-way binding native ($state) -->
			<input
				type="text"
				bind:value={newItemName}
				placeholder="Nama rute baru..."
				class="flex-1 px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
				onkeydown={(e) => e.key === "Enter" && handleAdd()}
			/>
			<!-- Optimistic disable -->
			<button 
				class="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
				onclick={handleAdd} disabled={isSubmitting}>
				{isSubmitting ? "Processing..." : "Simulasi Action"}
			</button>
		</div>

		<ul class="space-y-2">
			{#each items as item (item.id)}
				<li
					in:slide={{ duration: 250 }}
					out:fade={{ duration: 200 }}
					class="p-4 bg-slate-50 border rounded-lg flex items-center justify-between"
				>
					<div class="flex flex-col">
						<span class="font-medium text-sm text-slate-900">{item.name}</span>
						<span class="text-xs text-slate-500 font-mono">ID: {item.id.slice(0, 8)}</span>
					</div>

					<button
						class="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold rounded-md disabled:opacity-50 transition-colors"
						disabled={deletingId === item.id}
						onclick={() => handleDelete(item.id)}
					>
						{deletingId === item.id ? "Hapus..." : "Del"}
					</button>
				</li>
			{/each}
			
			{#if items.length === 0}
			   <p class="text-sm text-center text-slate-400 mt-4 py-8 italic border border-dashed rounded-lg">State kosong. Tidak ada data.</p>
			{/if}
		</ul>
	</div>

	<div class="px-6 py-4 bg-slate-50 border-t flex justify-end">
		<button class="px-4 py-2 bg-white border border-slate-300 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-50 transition-colors" onclick={handleReset}>
			Restore ke Data SSR
		</button>
	</div>
</div>
