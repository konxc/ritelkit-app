<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { fade, slide, fly } from "svelte/transition";
  import { t, initI18n } from "@lib/i18n/store.svelte";

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
    lang?: any;
    isCollapsed?: boolean;
  }

  let props: Props = $props();

  // Root call for SSR and initial hydration (untracked for Svelte 5)
  initI18n(untrack(() => props.lang));

  let isCollapsed = $state(false);
  let hasMounted = $state(false);

  $effect(() => {
    if (props.isCollapsed !== undefined) {
      isCollapsed = props.isCollapsed;
    }
  });

  $effect(() => {
    updateBodyClass();
  });

  onMount(() => {
    // On mount, sync classes based on the state we have
    updateBodyClass();

    // Prevent animation glitch on initial hydration load
    setTimeout(() => {
      hasMounted = true;
    }, 50);
  });

  function toggleSidebar() {
    isCollapsed = !isCollapsed;
    // Set cookie for server-side persistence
    const d = new Date();
    d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000);
    // biome-ignore lint/suspicious/noDocumentCookie: Need for server-side persistence
    document.cookie = `sidebar_collapsed=${isCollapsed};expires=${d.toUTCString()};path=/;SameSite=Lax`;
    updateBodyClass();
  }

  function updateBodyClass() {
    if (typeof document === "undefined") return;
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
      return props.currentPath === "/admin/overview" || props.currentPath === "/admin";
    }
    return props.currentPath.startsWith(path);
  };

  const ICONS: Record<string, string> = {
    overview:
      '<rect width="7" height="9" x="3" y="3" rx="1" ry="1"/><rect width="7" height="5" x="14" y="3" rx="1" ry="1"/><rect width="7" height="9" x="14" y="12" rx="1" ry="1"/><rect width="7" height="5" x="3" y="16" rx="1" ry="1"/>',
    katalog:
      '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    pesanan:
      '<path d="M14 2H6a2 2 0 0 0 -2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    pemasaran:
      '<path d="M16 21v-2a4 4 0 0 0 -4 -4H6a4 4 0 0 0 -4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0 -3 -3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0 -4 -4H9a4 4 0 0 0 -4 4v2"/><circle cx="12" cy="7" r="4"/>',
    sistem: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
    settings:
      '<path d="M12 15a3 3 0 1 0 0 -6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 0.33 1.82l0.06 0.06a2 2 0 0 1 0 2.83 2 2 0 0 1 -2.83 0l-0.06 -0.06a1.65 1.65 0 0 0 -1.82 -0.33 1.65 1.65 0 0 0 -1 1.51V21a2 2 0 0 1 -2 2 2 2 0 0 1 -2 -2v-0.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0 -1.82 0.33l-0.06 0.06a2 2 0 0 1 -2.83 0 2 2 0 0 1 0 -2.83l0.06 -0.06a1.65 1.65 0 0 0 0.33 -1.82 1.65 1.65 0 0 0 -1.51 -1H3a2 2 0 0 1 -2 -2 2 2 0 0 1 2 -2h0.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0 -0.33 -1.82l-0.06 -0.06a2 2 0 0 1 0 -2.83 2 2 0 0 1 2.83 0l0.06 0.06a1.65 1.65 0 0 0 1.82 0.33H9a1.65 1.65 0 0 0 1 -1.51V3a2 2 0 0 1 2 -2 2 2 0 0 1 2 2v0.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82 -0.33l0.06 -0.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-0.06 0.06a1.65 1.65 0 0 0 -0.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1 -2 2h-0.09a1.65 1.65 0 0 0 -1.51 1Z"/>',
    reports: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
    layout:
      '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
  };
</script>

<aside
  class="group relative z-40 hidden h-full w-[280px] shrink-0 flex-col border-r border-stone-200/60 bg-white px-5 pt-8 pb-4 shadow-[4px_0_24px_rgba(0,0,0,0.02)] {hasMounted
    ? 'transition-all duration-300'
    : ''} ease-[cubic-bezier(0.23,1,0.32,1)] lg:flex [.sidebar-collapsed_&]:w-[88px]"
>
  <button
    onclick={toggleSidebar}
    class="absolute top-11 -right-3.5 z-50 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-[10px] text-stone-500 shadow-sm transition-all hover:border-[#c48a3a] hover:text-[#c48a3a]"
    title={isCollapsed ? t("nav.expand_sidebar") : t("nav.collapse_sidebar")}
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  </button>

  <div
    class="mb-8 flex h-8 shrink-0 items-center px-4 {hasMounted
      ? 'transition-all duration-300'
      : ''} [.sidebar-collapsed_&]:w-full [.sidebar-collapsed_&]:justify-center"
  >
    <a
      href="/admin/overview"
      class="flex flex-nowrap items-center gap-2 font-['Syne',sans-serif] text-[0.92rem] font-extrabold text-stone-900 no-underline before:block before:h-[14px] before:w-[14px] before:shrink-0 before:rotate-45 before:rounded-[4px] before:bg-[#c48a3a] before:content-[''] xl:text-[0.98rem]"
    >
      {#if !isCollapsed}
        <span in:fade={{ duration: 200 }} class="block min-w-max whitespace-nowrap [.sidebar-collapsed_&]:hidden">
          {props.logoText || "SHOLAWAT"}<span class="text-[#c48a3a]">{props.logoSubtext || ".ENT"}</span>
        </span>
      {/if}
    </a>
  </div>

  <nav
    class="custom-scrollbar -mr-4 flex flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto pr-4 pb-8 [.sidebar-collapsed_&]:overflow-visible"
  >
    {#each props.navGroups as group, index}
      <div class="group/nav relative flex flex-col">
        {#if !isCollapsed}
          <h3
            in:fade={{ duration: 200 }}
            class="mb-2 px-4 text-[0.7rem] font-bold tracking-wider whitespace-nowrap text-stone-400 uppercase [.sidebar-collapsed_&]:hidden"
          >
            {t(group.title)}
          </h3>
        {:else if index > 0}
          <div class="mx-auto my-2 h-[1px] w-8 bg-stone-200/80"></div>
        {/if}

        <div class="flex flex-col gap-1">
          {#each group.items as item}
            {@const active = isActive(item.path)}
            <a
              href={item.path}
              title={t(item.name)}
              class="group/item relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[0.92rem] font-semibold {hasMounted
                ? 'transition-all duration-300'
                : ''} [.sidebar-collapsed_&]:h-12 [.sidebar-collapsed_&]:w-12 [.sidebar-collapsed_&]:justify-center [.sidebar-collapsed_&]:px-0 {active
                ? 'bg-gradient-to-r from-[#c48a3a] to-[#a6722d] text-white shadow-[0_8px_16px_rgba(196,138,58,0.25)]'
                : 'text-stone-500 hover:-translate-y-[1px] hover:bg-stone-50 hover:text-stone-900'}"
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
                <span in:fade={{ duration: 200 }} class="whitespace-nowrap [.sidebar-collapsed_&]:hidden"
                  >{t(item.name)}</span
                >
              {/if}

              {#if isCollapsed}
                <div
                  class="pointer-events-none absolute left-full z-50 ml-3 rounded bg-stone-900 px-2 py-1 text-[10px] whitespace-nowrap text-white opacity-0 transition-opacity group-hover/item:opacity-100"
                >
                  {t(item.name)}
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
