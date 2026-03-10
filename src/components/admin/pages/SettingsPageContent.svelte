<script lang="ts">
  import SettingsManager from "./SettingsManager.svelte";
  import { untrack } from "svelte";
  import { initI18n } from "../../../lib/i18n/store.svelte";

  let { lang }: { lang?: any } = $props();

  // Root call for SSR and initial hydration (untracked for Svelte 5)
  initI18n(untrack(() => lang));
</script>

<SettingsManager {lang} />
