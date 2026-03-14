<script lang="ts">
  import Button from "./ui/Button.svelte";
  import { t } from "@/lib/i18n/store.svelte";
  let {
    page,
    totalPages,
    prevHref,
    nextHref,
  }: {
    page: number;
    totalPages: number;
    prevHref?: string;
    nextHref?: string;
  } = $props();

  const handleNavigate = (e: MouseEvent, href: string | undefined) => {
    if (!href) return;
    e.preventDefault();
    window.history.pushState({}, "", href);
    window.dispatchEvent(new Event("popstate"));
  };
</script>

<div class="relative mt-8 flex w-full items-center justify-between border-t border-stone-200/60 pt-6">
  <span
    class="rounded-full bg-stone-100/80 px-3 py-1.5 text-[0.75rem] font-semibold text-stone-500 shadow-sm sm:rounded-md sm:bg-stone-100/80 sm:px-3 sm:py-1.5 sm:text-[0.85rem] sm:shadow-none"
  >
    {t("common.page")} <span class="font-bold text-stone-900">{page}</span>
    {t("common.of")}
    <span class="font-bold text-stone-900">{totalPages}</span>
  </span>
  <div class="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 sm:static sm:translate-x-0 sm:gap-2">
    <Button
      variant="simple"
      size="sm"
      href={prevHref}
      onclick={(e: MouseEvent) => handleNavigate(e, prevHref)}
      disabled={!prevHref}
      class="!rounded-xl !px-4 sm:!px-3.5"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
      >
      <span class="hidden sm:inline">{t("common.previous")}</span>
    </Button>

    <Button
      variant="simple"
      size="sm"
      href={nextHref}
      onclick={(e: MouseEvent) => handleNavigate(e, nextHref)}
      disabled={!nextHref}
      class="!rounded-xl !px-4 sm:!px-3.5"
    >
      <span class="hidden sm:inline">{t("common.next")}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
      >
    </Button>
  </div>
</div>
