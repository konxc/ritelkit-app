<script lang="ts">
  interface Props {
    value?: string;
    name?: string;
    placeholder?: string;
    class?: string;
    oninput?: (e: Event & { currentTarget: HTMLInputElement }) => void;
    onchange?: (e: Event & { currentTarget: HTMLInputElement }) => void;
  }

  let { value = "", name = "q", placeholder = "Cari...", class: className = "", oninput, onchange }: Props = $props();
</script>

<div class="relative flex-1 {className} group">
  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
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
      class="text-stone-400 transition-colors duration-300 group-focus-within:text-[#c48a3a]"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  </div>

  <input
    {name}
    {placeholder}
    {value}
    {oninput}
    {onchange}
    type="text"
    class="block w-full rounded-2xl border border-stone-200 bg-stone-50/50 py-2.5 pr-4 pl-11 text-[0.85rem] font-semibold text-stone-800 shadow-sm ring-stone-900/5 transition-all duration-300 placeholder:text-stone-400 hover:border-stone-300 hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-[4px] focus:ring-[#c48a3a]/15 focus:outline-none lg:text-sm"
  />
</div>
