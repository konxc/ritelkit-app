<script lang="ts">
  let {
    label,
    tone = "default",
  }: {
    label: string;
    tone?: "default" | "success" | "danger" | "warning" | "info";
  } = $props();

  let toneClass = $derived(
    tone === "success"
      ? "success"
      : tone === "danger"
        ? "danger"
        : tone === "warning"
          ? "warning"
          : tone === "info"
            ? "info"
            : "",
  );
</script>

<span class={`badge ${toneClass}`.trim()}>{label}</span>
