import { onMount } from "svelte";

export type AdminFilterState = {
  q: string;
  status: string;
  categoryId: string;
  page: number;
  subtab: string;
};

export function createAdminFilters(initial: Partial<AdminFilterState> = {}) {
  let q = $state(initial.q || "");
  let status = $state(initial.status || "");
  let categoryId = $state(initial.categoryId || "");
  let page = $state(initial.page || 1);
  let subtab = $state(initial.subtab || "");

  const syncFromUrl = () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    q = params.get("q") || "";
    status = params.get("status") || "";
    categoryId = params.get("category") || "";
    page = parseInt(params.get("page") || "1", 10);
    subtab = params.get("subtab") || initial.subtab || "";
  };

  const updateUrl = () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);

    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");

    if (status) url.searchParams.set("status", status);
    else url.searchParams.delete("status");

    if (categoryId) url.searchParams.set("category", categoryId);
    else url.searchParams.delete("category");

    if (subtab) url.searchParams.set("subtab", subtab);
    else url.searchParams.delete("subtab");

    if (page > 1) url.searchParams.set("page", page.toString());
    else url.searchParams.delete("page");

    window.history.replaceState({}, "", url.href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const buildPageUrl = (targetPage: number) => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    if (targetPage > 1) url.searchParams.set("page", String(targetPage));
    else url.searchParams.delete("page");
    return url.search;
  };

  onMount(() => {
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("astro:after-navigation", syncFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("astro:after-navigation", syncFromUrl);
    };
  });

  return {
    get q() {
      return q;
    },
    set q(v) {
      q = v;
    },
    get status() {
      return status;
    },
    set status(v) {
      status = v;
    },
    get categoryId() {
      return categoryId;
    },
    set categoryId(v) {
      categoryId = v;
    },
    get page() {
      return page;
    },
    set page(v) {
      page = v;
    },
    get subtab() {
      return subtab;
    },
    set subtab(v) {
      subtab = v;
    },
    get isInitial() {
      if (typeof window === "undefined") return true;
      const params = new URLSearchParams(window.location.search);
      return (
        !params.get("q") &&
        !params.get("status") &&
        !params.get("category") &&
        (params.get("page") === "1" || !params.get("page"))
      );
    },
    syncFromUrl,
    updateUrl,
    buildPageUrl,
  };
}
