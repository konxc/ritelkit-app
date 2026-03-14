<script lang="ts">
  let {
    tab,
    q = "",
    status = "",
    page = 1,
    limit = 30,
    rows = [],
    total = 0,
    lang,
  }: {
    tab: string;
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
    rows?: any[];
    total?: number;
    lang?: any;
  } = $props();
  initI18n(untrack(() => lang));

  import AdminUsersManager from "@/components/admin/pages/AdminUsersManager.svelte";
  import AuditLogManager from "@/components/admin/pages/AuditLogManager.svelte";
  import CmsManager from "@/components/admin/pages/CmsManager.svelte";
  import NotificationsManager from "@/components/admin/pages/NotificationsManager.svelte";
  import QueryProvider from "@/components/admin/QueryProvider.svelte";
  import { initI18n } from "@/lib/i18n/store.svelte";
  import { untrack } from "svelte";

  // Root call for SSR and initial hydration (untracked for Svelte 5)
</script>

<QueryProvider initialData={rows}>
  {#if tab === "content"}
    <CmsManager {q} {status} {page} {limit} {rows} {total} {lang} />
  {:else if tab === "notifications"}
    <NotificationsManager {q} {status} {page} {limit} {rows} {total} {lang} />
  {:else if tab === "audit"}
    <AuditLogManager {q} {status} {page} {limit} {rows} {total} {lang} />
  {:else if tab === "admins"}
    <AdminUsersManager {rows} {q} {status} {lang} />
  {/if}
</QueryProvider>
