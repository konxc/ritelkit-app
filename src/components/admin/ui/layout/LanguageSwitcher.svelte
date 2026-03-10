<script lang="ts">
  import { onMount } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { i18n, initI18n, t } from "../../../../lib/i18n/store.svelte";
  import type { LanguageCode } from "../../../../lib/i18n/translations";

  interface Language {
    code: LanguageCode;
    label: string;
    flag: string;
  }

  import { actions } from "astro:actions";
  import { untrack } from "svelte";

  const languages: Language[] = [
    { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "ja", label: "日本語 (Japanese)", flag: "🇯🇵" },
  ];

  let isOpen = $state(false);
  let isChanging = $state(false);
  let { lang }: { lang?: any } = $props();

  // Root call for SSR and initial hydration (untracked for Svelte 5)
  initI18n(untrack(() => lang));

  const currentLangCode = $derived(i18n.lang);
  const currentLang = $derived(languages.find((l) => l.code === currentLangCode) || languages[0]);

  async function setLanguage(code: LanguageCode) {
    if (isChanging) return;
    isChanging = true;

    // Use Astro Action to set cookie on server
    const { error } = await actions.setLanguage({ lang: code });

    if (!error) {
      i18n.lang = code;
      isOpen = false;
      // Reload to ensure all SSR content is updated with the new language
      window.location.reload();
    } else {
      console.error("Failed to set language:", error);
      isChanging = false;
    }
  }

  function toggle() {
    isOpen = !isOpen;
  }

  const closeOnOutsideClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (isOpen && !target.closest(".lang-switcher-container")) {
      isOpen = false;
    }
  };

  onMount(() => {
    window.addEventListener("click", closeOnOutsideClick);
    return () => window.removeEventListener("click", closeOnOutsideClick);
  });
</script>

<div class="lang-switcher-container relative shrink-0">
  <button
    onclick={(e) => {
      e.stopPropagation();
      toggle();
    }}
    class="flex h-11 cursor-pointer items-center gap-2.5 rounded-2xl border border-stone-200/80 bg-white/80 px-3.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-[#c48a3a]/30 hover:bg-stone-50 hover:shadow-md active:scale-[0.98] {isChanging
      ? 'cursor-wait opacity-50'
      : ''}"
    disabled={isChanging}
    title={t("common.select_language")}
  >
    <span class="text-lg leading-none">{currentLang.flag}</span>
    <span class="text-[0.75rem] font-black tracking-widest text-stone-600 uppercase">{currentLang.code}</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="text-stone-400 transition-transform {isOpen ? 'rotate-180' : ''}"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </button>

  {#if isOpen}
    <div
      in:scale={{ duration: 200, start: 0.95, opacity: 0 }}
      out:fade={{ duration: 150 }}
      class="absolute top-full right-0 z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl"
    >
      <div class="bg-stone-50/50 p-4 pb-2">
        <span class="text-[0.6rem] font-black tracking-[0.2em] text-stone-400 uppercase"
          >{t("common.select_language")}</span
        >
      </div>
      <div class="flex flex-col gap-1 p-2">
        {#each languages as lang}
          <button
            onclick={() => setLanguage(lang.code)}
            class="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-300 {currentLangCode ===
            lang.code
              ? 'bg-[#c48a3a]/10 text-[#c48a3a]'
              : 'text-stone-600 hover:bg-stone-50'}"
          >
            <span class="text-xl leading-none">{lang.flag}</span>
            <div class="flex flex-col">
              <span class="text-[0.85rem] leading-tight font-bold">{lang.label}</span>
              <span class="text-[0.65rem] font-semibold text-stone-400 uppercase">{lang.code}</span>
            </div>
            {#if currentLangCode === lang.code}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="ml-auto"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
