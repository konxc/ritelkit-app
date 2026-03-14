<script lang="ts">
  import { onMount, untrack } from "svelte";
  import LanguageSwitcher from "@components/admin/ui/layout/LanguageSwitcher.svelte";
  import { t, initI18n } from "@lib/i18n/store.svelte";
  interface Props {
    title: string;
    logoText?: string;
    lang?: any;
  }
  let { title, logoText = "SHOLAWAT", lang }: Props = $props();

  // Root call for SSR and initial hydration (untracked for Svelte 5)
  initI18n(untrack(() => lang));
  import { mobileSidebarState } from "@lib/sidebar-state.svelte";
</script>

<header
  class="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-stone-200/50 bg-white/85 px-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl lg:hidden"
>
  <div class="flex items-center justify-center gap-3">
    <button
      onclick={() => mobileSidebarState.toggle()}
      class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-stone-100/80 text-stone-600 transition-colors hover:bg-[#c48a3a]/10 hover:text-[#c48a3a]"
      aria-label="Toggle Navigation"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" x2="20" y1="12" y2="12" />
        <line x1="4" x2="20" y1="6" y2="6" />
        <line x1="4" x2="20" y1="18" y2="18" />
      </svg>
    </button>
    <div class="flex flex-col justify-center">
      <h1
        class="mb-1 bg-gradient-to-br from-stone-900 to-stone-600 bg-clip-text font-['Syne',sans-serif] text-[1.35rem] leading-none font-extrabold tracking-tight text-transparent"
      >
        {t(title)}
      </h1>
      <p class="text-[0.65rem] font-bold tracking-wider text-stone-400 uppercase">{t("nav.admin_dashboard")}</p>
    </div>
  </div>

  <div class="flex items-center gap-2">
    <LanguageSwitcher {lang} />
    <a
      href="/admin/overview"
      class="hidden items-center gap-1.5 font-['Syne',sans-serif] text-[0.8rem] font-extrabold tracking-tight text-stone-900 no-underline before:block before:h-[8px] before:w-[8px] before:shrink-0 before:rotate-45 before:rounded-[1px] before:bg-[#c48a3a] before:content-[''] sm:flex"
    >
      {logoText}
    </a>
    <div class="mx-0.5 h-6 w-[1px] bg-stone-200/80"></div>
    <a
      href="/admin/profile"
      class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200/80 bg-gradient-to-br from-stone-50 to-stone-100 text-[#c48a3a] shadow-inner transition-colors hover:border-[#c48a3a]/30 hover:bg-stone-50"
      aria-label={t("nav.view_profile")}
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
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    </a>
  </div>
</header>
