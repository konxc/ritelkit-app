<script lang="ts">
let {
  urls = [],
  onChange,
  editable = true,
}: {
  urls: string[];
  onChange?: (next: string[]) => void;
  editable?: boolean;
} = $props();

const handleMove = (index: number, direction: -1 | 1) => {
  if (!onChange) return;
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= urls.length) return;
  const next = [...urls];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  onChange(next);
};

const handleDelete = (index: number) => {
  if (!onChange) return;
  onChange(urls.filter((_, i) => i !== index));
};

let dragIndex = $state<number | null>(null);

const handleDragStart = (index: number) => {
  dragIndex = index;
};

const handleDrop = (toIndex: number) => {
  if (dragIndex === null || dragIndex === toIndex || !onChange) return;
  const next = [...urls];
  const [moved] = next.splice(dragIndex, 1);
  next.splice(toIndex, 0, moved);
  onChange(next);
  dragIndex = null;
};
</script>

<div class="flex flex-wrap gap-3">
    {#each urls as url, i (url + i)}
        <div
            class="group relative w-20 h-20 rounded-xl overflow-hidden border border-stone-200 bg-stone-50 shadow-sm"
            role="button"
            tabindex="0"
            draggable={editable}
            ondragstart={() => handleDragStart(i)}
            ondrop={(e) => {
                e.preventDefault();
                handleDrop(i);
            }}
            ondragover={(e) => e.preventDefault()}
        >
            <img src={url} alt="Gallery" class="w-full h-full object-cover" />

            {#if editable}
                <div
                    class="absolute inset-x-0 bottom-0 py-1 px-1 bg-black/40 backdrop-blur-sm flex justify-around opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <button
                        type="button"
                        class="text-white hover:text-[#c48a3a] text-[10px]"
                        onclick={() => handleMove(i, -1)}>◀</button
                    >
                    <button
                        type="button"
                        class="text-white hover:text-[#c48a3a] text-[10px]"
                        onclick={() => handleMove(i, 1)}>▶</button
                    >
                    <button
                        type="button"
                        class="text-white hover:text-red-400 text-[10px]"
                        onclick={() => handleDelete(i)}>✕</button
                    >
                </div>
                {#if i === 0}
                    <div class="absolute top-0 right-0 p-1">
                        <div
                            class="bg-[#c48a3a] text-[8px] text-white px-1 rounded-sm font-bold uppercase"
                        >
                            Main
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    {/each}
</div>

<style>
    div[draggable="true"] {
        cursor: grab;
    }
    div[draggable="true"]:active {
        cursor: grabbing;
    }
</style>
