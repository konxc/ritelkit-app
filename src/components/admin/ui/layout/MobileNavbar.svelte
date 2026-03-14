<script lang="ts">
  import { t, initI18n } from "@/lib/i18n/store.svelte";
  import { onMount, untrack } from "svelte";

  interface Props {
    currentPath: string;
    lang?: any;
  }

  let { currentPath, lang }: Props = $props();

  // Root call for SSR and initial hydration (untracked for Svelte 5)
  initI18n(untrack(() => lang));

  onMount(() => {
    // Already inited
  });

  const isActive = (path: string) => {
    if (path === "/admin/overview") {
      return currentPath === "/admin/overview" || currentPath === "/admin";
    }
    return currentPath.startsWith(path);
  };

  const navItems = [
    { name: "nav.overview", path: "/admin/overview", iconKey: "overview" },
    { name: "nav.orders", path: "/admin/orders", iconKey: "orders" },
    { name: "nav.catalog", path: "/admin/catalog", iconKey: "catalog" },
    { name: "nav.settings", path: "/admin/settings", iconKey: "settings" },
  ];
</script>

<nav
  class="fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-between gap-1.5 rounded-3xl border border-white/10 bg-stone-900/95 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:hidden"
>
  {#each navItems as item}
    {@const active = isActive(item.path)}
    <a
      href={item.path}
      class="flex h-14 flex-1 flex-col items-center justify-center rounded-2xl border no-underline transition-all duration-300 {active
        ? 'border-[#c48a3a]/50 bg-gradient-to-br from-[#c48a3a] to-[#a6722d] text-white shadow-[0_4px_12px_rgba(196,138,58,0.3)]'
        : 'border-transparent text-white/50 hover:bg-white/5 hover:text-white'}"
    >
      {#if item.iconKey === "overview"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mb-1"
          ><path d="m3 9 9-7 9 7v11a2 2 0 0 1 -2 2H5a2 2 0 0 1 -2 -2z"></path><polyline points="9 22 9 12 15 12 15 22"
          ></polyline></svg
        >
      {:else if item.iconKey === "orders"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mb-1"
          ><path d="M14 2H6a2 2 0 0 0 -2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2V8z"></path><polyline
            points="14 2 14 8 20 8"
          ></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline
            points="10 9 9 9 8 9"
          ></polyline></svg
        >
      {:else if item.iconKey === "catalog"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mb-1"
          ><path
            d="m21.64 3.64 -1.28 -1.28a1.21 1.21 0 0 0 -1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0 -1.72Z"
          ></path><path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"
          ></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path></svg
        >
      {:else if item.iconKey === "settings"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mb-1"
        >
          <path d="M12 15a3 3 0 1 0 0 -6 3 3 0 0 0 0 6Z"></path>
          <path
            d="M19.4 15a1.65 1.65 0 0 0 0.33 1.82l0.06 0.06a2 2 0 0 1 0 2.83 2 2 0 0 1 -2.83 0l-0.06 -0.06a1.65 1.65 0 0 0 -1.82 -0.33 1.65 1.65 0 0 0 -1 1.51V21a2 2 0 0 1 -2 2 2 2 0 0 1 -2 -2v-0.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0 -1.82 0.33l-0.06 0.06a2 2 0 0 1 -2.83 0 2 2 0 0 1 0 -2.83l0.06 -0.06a1.65 1.65 0 0 0 0.33 -1.82 1.65 1.65 0 0 0 -1.51 -1H3a2 2 0 0 1 -2 -2 2 2 0 0 1 2 -2h0.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0 -0.33 -1.82l-0.06 -0.06a2 2 0 0 1 0 -2.83 2 2 0 0 1 2.83 0l0.06 0.06a1.65 1.65 0 0 0 1.82 0.33H9a1.65 1.65 0 0 0 1 -1.51V3a2 2 0 0 1 2 -2 2 2 0 0 1 2 2v0.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82 -0.33l0.06 -0.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-0.06 0.06a1.65 1.65 0 0 0 -0.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1 -2 2h-0.09a1.65 1.65 0 0 0 -1.51 1z"
          ></path>
        </svg>
      {/if}
      <span class="text-[0.6rem] font-bold tracking-wider uppercase">{t(item.name)}</span>
    </a>
  {/each}
</nav>
