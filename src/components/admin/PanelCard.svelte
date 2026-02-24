<script lang="ts">
  let { title, className = "" }: { title?: string; className?: string } = $props();
</script>

<div class={`card ${className}`.trim()}>
  {#if title}
    <strong>{title}</strong>
  {/if}
  <slot />
</div>
