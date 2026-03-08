<script lang="ts">
// Meniru `actions` dari astro (opsional karena ini file simulasi)
import { fade, slide } from "svelte/transition";
import TextInput from "../ui/forms/TextInput.svelte";
import Button from "../ui/Button.svelte";

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
    console.error("Failed to call Astro Action:", e);
    alert("Failed to call mutation Action.");
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

<div class="max-w-xl overflow-hidden rounded-xl border bg-white shadow-sm">
  <div class="border-b px-6 py-5">
    <h2 class="text-xl font-semibold tracking-tight text-slate-900">Manajemen Item (RPC Lokal)</h2>
    <p class="mt-1 text-sm text-slate-500">
      Contoh ini menunjukkan efisiensi Astro SSR dan Svelte 5 tanpa beban kognitif tRPC.
    </p>
  </div>

  <div class="px-6 py-5">
    <!-- Penggunaan $derived state -->
    <p class="mb-4 text-sm font-medium text-slate-700">
      Total data aktif dalam memory lokal (SSR + Reaktif): {totalItems}
    </p>

    <div class="mb-6 flex items-center gap-3">
      <!-- Two-way binding native ($state) -->
      <div class="flex-1">
        <TextInput
          id="newItemName"
          bind:value={newItemName}
          placeholder="Nama rute baru..."
          onkeydown={(e: KeyboardEvent) => e.key === "Enter" && handleAdd()}
        />
      </div>
      <!-- Optimistic disable -->
      <Button variant="primary" onclick={handleAdd} disabled={isSubmitting}>
        {isSubmitting ? "Sedang diproses..." : "Jalankan Simulasi"}
      </Button>
    </div>

    <ul class="space-y-2">
      {#each items as item (item.id)}
        <li
          in:slide={{ duration: 250 }}
          out:fade={{ duration: 200 }}
          class="flex items-center justify-between rounded-lg border bg-slate-50 p-4"
        >
          <div class="flex flex-col">
            <span class="text-sm font-medium text-slate-900">{item.name}</span>
            <span class="font-mono text-xs text-slate-500">ID: {item.id.slice(0, 8)}</span>
          </div>

            <Button variant="danger" size="sm" disabled={deletingId === item.id} onclick={() => handleDelete(item.id)}>
              {deletingId === item.id ? "Hapus..." : "Hapus"}
            </Button>
        </li>
      {/each}

      {#if items.length === 0}
        <p class="mt-4 rounded-lg border border-dashed py-8 text-center text-sm text-slate-400 italic">
          Belum ada data tersedia.
        </p>
      {/if}
    </ul>
  </div>

  <div class="flex justify-end border-t bg-slate-50 px-6 py-4">
    <Button variant="outline" onclick={handleReset}>Kembalikan Data SSR</Button>
  </div>
</div>
