<script lang="ts">
  interface Props {
    title: string;
    logoText?: string;
  }
  let { title, logoText = "SHOLAWAT" }: Props = $props();
</script>

<header
  class="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-stone-200/50 bg-white/85 px-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl lg:hidden"
>
  <div class="flex flex-col justify-center">
    <h1
      class="mb-1 bg-gradient-to-br from-stone-900 to-stone-600 bg-clip-text font-['Syne',sans-serif] text-[1.35rem] leading-none font-extrabold tracking-tight text-transparent"
    >
      {title}
    </h1>
    <p class="text-[0.65rem] font-bold tracking-wider text-stone-400 uppercase">Dashboard Admin</p>
  </div>

  <div class="flex items-center gap-3">
    <a
      href="/admin/overview"
      class="flex items-center gap-1.5 font-['Syne',sans-serif] text-[0.95rem] font-extrabold tracking-tight text-stone-900 no-underline before:block before:h-[10px] before:w-[10px] before:shrink-0 before:rotate-45 before:rounded-[2px] before:bg-[#c48a3a] before:content-['']"
    >
      {logoText}
    </a>
    <div class="mx-0.5 h-6 w-[1px] bg-stone-200/80"></div>
    <a
      href="/admin/profile"
      class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200/80 bg-gradient-to-br from-stone-50 to-stone-100 text-[#c48a3a] shadow-inner transition-colors hover:border-[#c48a3a]/30 hover:bg-stone-50"
      aria-label="Lihat Profil"
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
