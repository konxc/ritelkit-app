<script lang="ts">
  let { className = "" }: { className?: string } = $props();
</script>

<div class={`table-actions ${className}`.trim()}>
  <slot />
</div>
