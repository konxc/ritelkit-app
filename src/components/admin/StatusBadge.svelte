<script lang="ts">
  let {
    label,
    tone = "default",
  }: {
    label: string;
    tone?: "default" | "success" | "danger";
  } = $props();

  let toneClass = $derived(
    tone === "success" ? "success" : tone === "danger" ? "danger" : "",
  );
</script>

<span class={`badge ${toneClass}`.trim()}>{label}</span>
