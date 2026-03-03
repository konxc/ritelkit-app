<script lang="ts">
interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs?: Tab[];
  activeTab?: string;
  class?: string;
  onChange?: (id: string) => void;
  [key: string]: any;
}

let {
  tabs = [],
  activeTab = $bindable(tabs[0]?.id || ""),
  class: className = "",
  onChange,
  ...rest
}: Props = $props();

function handleTabClick(id: string) {
  activeTab = id;
  if (onChange) onChange(id);
}
</script>

<div class="inline-flex p-1 bg-stone-100 rounded-xl {className}" {...rest}>
  {#each tabs as tab}
    <button
      onclick={() => handleTabClick(tab.id)}
      class="px-5 py-2.5 text-sm transition-all {
        activeTab === tab.id
          ? 'font-bold bg-white text-stone-900 rounded-lg shadow-sm'
          : 'font-semibold text-stone-500 hover:text-stone-900'
      }"
      aria-selected={activeTab === tab.id}
      role="tab"
    >
      {tab.label}
    </button>
  {/each}
</div>
