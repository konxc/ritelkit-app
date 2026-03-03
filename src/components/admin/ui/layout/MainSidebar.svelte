<script lang="ts">
import { onMount } from "svelte";
import { fade, slide, fly } from "svelte/transition";

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface Props {
  navGroups: NavGroup[];
  currentPath: string;
  logoText?: string;
  logoSubtext?: string;
}

let { navGroups, currentPath, logoText = "SHOLAWAT", logoSubtext = ".ENT" }: Props = $props();

let isCollapsed = $state(false);

onMount(() => {
  const savedState = localStorage.getItem("sidebarState");
  isCollapsed = savedState === "collapsed";
  updateBodyClass();
});

function toggleSidebar() {
  isCollapsed = !isCollapsed;
  localStorage.setItem("sidebarState", isCollapsed ? "collapsed" : "expanded");
  updateBodyClass();
}

function updateBodyClass() {
  if (isCollapsed) {
    document.body.classList.add("sidebar-collapsed");
    document.documentElement.classList.add("sidebar-collapsed");
  } else {
    document.body.classList.remove("sidebar-collapsed");
    document.documentElement.classList.remove("sidebar-collapsed");
  }
}

const isActive = (path: string) => {
  if (path === "/admin/overview") {
    return currentPath === "/admin/overview" || currentPath === "/admin";
  }
  return currentPath.startsWith(path);
};

const ICONS: Record<string, string> = {
  overview:
    '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  katalog:
    '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  pesanan:
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  pemasaran:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  sistem: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
  settings:
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  reports: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
};
</script>

<aside
  class="hidden lg:flex shrink-0 bg-white border-r border-stone-200/60 flex-col h-full z-40 px-5 pt-8 pb-4 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group relative {isCollapsed ? 'w-[88px]' : 'w-[280px]'}"
>
  <button
    onclick={toggleSidebar}
    class="absolute -right-3.5 top-9 w-7 h-7 bg-white border border-stone-200 shadow-sm rounded-full flex items-center justify-center text-stone-500 hover:text-[#c48a3a] hover:border-[#c48a3a] transition-all cursor-pointer z-50 text-[10px]"
    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
  >
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
      class="transition-transform duration-300 {isCollapsed ? 'rotate-180' : ''}"
    >
      <path d="m15 18-6-6 6-6"/>
    </svg>
  </button>

  <div class="mb-8 px-4 shrink-0 flex items-center h-8 transition-all duration-300 {isCollapsed ? 'justify-center w-full' : ''}">
    <a
      href="/admin/overview"
      class="font-['Syne',sans-serif] font-extrabold text-[1.1rem] xl:text-[1.15rem] tracking-tight text-stone-900 flex items-center gap-2.5 no-underline before:content-[''] before:block before:w-[14px] before:h-[14px] before:bg-[#c48a3a] before:shrink-0 before:rounded-[4px] before:rotate-45"
    >
      {#if !isCollapsed}
        <span in:fade={{duration: 200}} class="whitespace-nowrap overflow-hidden">
          {logoText}<span class="text-[#c48a3a]">{logoSubtext}</span>
        </span>
      {/if}
    </a>
  </div>

  <nav class="flex flex-col gap-6 overflow-y-auto flex-1 custom-scrollbar pb-8 overflow-x-hidden pr-4 -mr-4">
    {#each navGroups as group, index}
      <div class="flex flex-col relative group/nav">
        {#if !isCollapsed}
          <h3 in:fade={{duration: 200}} class="px-4 text-[0.7rem] font-bold uppercase tracking-wider text-stone-400 mb-2 whitespace-nowrap">
            {group.title}
          </h3>
        {:else if index > 0}
          <div class="w-8 h-[1px] bg-stone-200/80 my-2 mx-auto"></div>
        {/if}
        
        <div class="flex flex-col gap-1">
          {#each group.items as item}
            {@const active = isActive(item.path)}
            <a
              href={item.path}
              title={item.name}
              class="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[0.92rem] font-semibold transition-all duration-300 relative {isCollapsed ? 'justify-center w-12 h-12 px-0' : ''} {active ? 'bg-gradient-to-r from-[#c48a3a] to-[#a6722d] text-white shadow-[0_8px_16px_rgba(196,138,58,0.25)]' : 'text-stone-500 hover:bg-stone-50 hover:-translate-y-[1px] hover:text-stone-900'}"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width={active ? "2.5" : "2"} 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                class="shrink-0 transition-transform duration-300 {active ? 'scale-110' : ''}"
              >
                {@html ICONS[item.icon]}
              </svg>
              
              {#if !isCollapsed}
                <span in:fade={{duration: 200}} class="whitespace-nowrap">{item.name}</span>
              {/if}

              {#if isCollapsed && !active}
                 <div class="opacity-0 group-hover:opacity-100 absolute left-full ml-3 px-2 py-1 bg-stone-900 text-white text-[10px] rounded pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.name}
                 </div>
              {/if}
            </a>
          {/each}
        </div>
      </div>
    {/each}
  </nav>
</aside>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(196, 138, 58, 0.2);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(196, 138, 58, 0.4);
  }
</style>
