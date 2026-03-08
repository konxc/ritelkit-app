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
    onclick={(e) => {
      e.stopPropagation();
      toggle();
    }}
    class="flex cursor-pointer items-center gap-3 rounded-full border border-stone-200/80 bg-white/80 p-1.5 pr-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-[#c48a3a]/30 hover:bg-stone-50 hover:shadow-md active:scale-[0.98]"
  >
    <div
      class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200/60 bg-gradient-to-br from-stone-50 to-stone-100 text-[#c48a3a] shadow-inner"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg
      >
    </div>
    <div class="flex flex-col text-left">
      <span class="text-[0.85rem] leading-tight font-bold text-stone-900">{name}</span>
      <span class="text-[0.65rem] leading-tight font-semibold text-stone-400">{role}</span>
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
      class="ml-1 text-stone-400 transition-transform {isOpen ? 'rotate-180' : ''}"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </button>

  {#if isOpen}
    <div
      in:scale={{ duration: 200, start: 0.95, opacity: 0 }}
      out:fade={{ duration: 150 }}
      class="absolute top-full right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-stone-200/60 bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl"
    >
      <div class="border-b border-stone-100 bg-gradient-to-b from-stone-50/80 to-transparent p-5">
        <p class="mb-0.5 text-xs font-semibold tracking-wide text-stone-400">Signed in as</p>
        <p class="truncate text-sm font-bold text-stone-900">{email}</p>
      </div>
      <div class="flex flex-col gap-1.5 border-b border-stone-100 px-3 pt-3 pb-2">
        <a
          href="/admin/profile"
          class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9rem] font-semibold text-stone-600 transition-all duration-300 hover:bg-[#c48a3a]/10 hover:text-[#c48a3a]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-stone-400 transition-colors duration-300 group-hover:text-[#c48a3a]"
            ><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg
          >
          Profil Saya
        </a>
        <a
          href="/admin/settings"
          class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9rem] font-semibold text-stone-600 transition-all duration-300 hover:bg-[#c48a3a]/10 hover:text-[#c48a3a]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-stone-400 transition-colors duration-300 group-hover:text-[#c48a3a]"
            ><path
              d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
            /><circle cx="12" cy="12" r="3" /></svg
          >
          Pengaturan Toko
        </a>
        <a
          href="https://wa.me/6287825228548"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9rem] font-semibold text-stone-600 transition-all duration-300 hover:bg-[#c48a3a]/10 hover:text-[#c48a3a]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-stone-400 transition-colors duration-300 group-hover:text-[#c48a3a]"
            ><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path
              d="M12 17h.01"
            /></svg
          >
          Pusat Bantuan
        </a>
      </div>
      <div class="px-3 pt-2 pb-3">
        <form method="post" action={logoutAction} class="m-0 block">
          <button
            type="submit"
            class="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9rem] font-semibold text-red-600 transition-all duration-300 hover:bg-red-50 hover:shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line
                x1="21"
                x2="9"
                y1="12"
                y2="12"
              /></svg
            >
            Keluar Sesi
          </button>
        </form>
      </div>
    </div>
  {/if}
</div>
