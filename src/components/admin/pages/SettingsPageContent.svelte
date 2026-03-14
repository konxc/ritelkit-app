<script lang="ts">
  let { lang }: { lang?: any } = $props();

  import { untrack } from "svelte";
  import { initI18n } from "@/lib/i18n/store.svelte";
  initI18n(untrack(() => lang));

  import SettingsManager from "@/components/admin/pages/SettingsManager.svelte";
  import QueryProvider from "@/components/admin/QueryProvider.svelte";

  // Root call for SSR and initial hydration (untracked for Svelte 5)
</script>

<QueryProvider>
  <SettingsManager {lang} />
</QueryProvider>
