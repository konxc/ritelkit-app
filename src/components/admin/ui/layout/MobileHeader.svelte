<script lang="ts">
interface Props {
  title: string;
  logoText?: string;
}
let { title, logoText = "SHOLAWAT" }: Props = $props();
</script>

<header
  class="h-[72px] shrink-0 lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-stone-200/50 px-4 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
>
  <div class="flex flex-col justify-center">
    <h1 class="font-['Syne',sans-serif] text-[1.35rem] font-extrabold tracking-tight bg-gradient-to-br from-stone-900 to-stone-600 bg-clip-text text-transparent leading-none mb-1">
      {title}
    </h1>
    <p class="text-stone-400 text-[0.65rem] font-bold uppercase tracking-wider">
      Dashboard Admin
    </p>
  </div>

  <div class="flex items-center gap-3">
    <a
      href="/admin/overview"
      class="font-['Syne',sans-serif] font-extrabold text-[0.95rem] tracking-tight text-stone-900 flex items-center gap-1.5 no-underline before:content-[''] before:block before:w-[10px] before:h-[10px] before:bg-[#c48a3a] before:shrink-0 before:rounded-[2px] before:rotate-45"
    >
      {logoText}
    </a>
    <div class="w-[1px] h-6 bg-stone-200/80 mx-0.5"></div>
    <a href="/admin/profile" class="w-9 h-9 shrink-0 shadow-sm rounded-full border border-stone-200/80 bg-white flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors" aria-label="Lihat Profil">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </a>
  </div>
</header>
