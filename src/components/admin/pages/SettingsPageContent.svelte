<script lang="ts">
  let { lang }: { lang?: any } = $props();
  initI18n(untrack(() => lang));

  import SettingsManager from "./SettingsManager.svelte";
  import { untrack } from "svelte";
  import { initI18n } from "../../../lib/i18n/store.svelte";

  // Root call for SSR and initial hydration (untracked for Svelte 5)
</script>

<SettingsManager {lang} />
