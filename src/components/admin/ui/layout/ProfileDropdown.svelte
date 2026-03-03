<script lang="ts">
import { onMount } from "svelte";
import { fade, scale } from "svelte/transition";
import Avatar from "../media/Avatar.svelte";

interface Props {
  email?: string;
  name?: string;
  role?: string;
  logoutAction?: string;
}

let {
  email = "admin@rotisholawat.com",
  name = "Admin",
  role = "Administrator",
  logoutAction = "",
}: Props = $props();

let isOpen = $state(false);

function toggle() {
  isOpen = !isOpen;
}

const closeOnOutsideClick = (_e: MouseEvent) => {
  if (isOpen) {
    isOpen = false;
  }
};

onMount(() => {
  window.addEventListener("click", closeOnOutsideClick);
  return () => window.removeEventListener("click", closeOnOutsideClick);
});
</script>

<div class="relative shrink-0">
  <button 
    onclick={(e) => { e.stopPropagation(); toggle(); }}
    class="flex items-center gap-3 p-1.5 pr-3 rounded-full border border-stone-200/80 bg-white/80 hover:bg-stone-50 transition-all duration-300 shadow-sm cursor-pointer"
  >
    <div class="w-8 h-8 rounded-full bg-stone-100 border border-stone-200/60 flex items-center justify-center text-stone-500 overflow-hidden shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </div>
    <div class="flex flex-col text-left">
      <span class="text-[0.85rem] font-bold text-stone-900 leading-tight">{name}</span>
      <span class="text-[0.65rem] font-semibold text-stone-400 leading-tight">{role}</span>
    </div>
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
      class="text-stone-400 ml-1 transition-transform {isOpen ? 'rotate-180' : ''}"
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  </button>

  {#if isOpen}
    <div 
      in:scale={{duration: 150, start: 0.95}}
      out:fade={{duration: 100}}
      class="absolute top-full right-0 mt-3 w-60 bg-white border border-stone-100 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.08)] overflow-hidden z-50"
    >
      <div class="p-4 border-b border-stone-50 bg-stone-50/50">
        <p class="text-xs font-semibold text-stone-400 tracking-wide mb-0.5">Signed in as</p>
        <p class="text-sm font-bold text-stone-900 truncate">{email}</p>
      </div>
      <div class="px-2 pt-2 pb-1 border-b border-stone-100 flex flex-col gap-1">
        <a href="/admin/profile" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.9rem] font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profil Saya
        </a>
        <a href="/admin/settings" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.9rem] font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          Pengaturan Toko
        </a>
        <a href="https://wa.me/6287825228548" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.9rem] font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          Pusat Bantuan
        </a>
      </div>
      <div class="px-2 pb-2 pt-1">
        <form method="post" action={logoutAction} class="block m-0">
          <button type="submit" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.9rem] font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Keluar Sesi
          </button>
        </form>
      </div>
    </div>
  {/if}
</div>
