<script lang="ts">
  let { title }: { title: string } = $props();
</script>

<div class="toolbar">
  <strong>{title}</strong>
  <slot />
</div>
