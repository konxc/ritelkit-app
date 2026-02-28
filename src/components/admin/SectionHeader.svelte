<script lang="ts">
let {
	title,
	badge,
	muted,
}: {
	title: string;
	badge?: string;
	muted?: string;
} = $props();
</script>

<div class="section-header">
  <h2>{title}</h2>
  {#if badge}
    <span class="badge">{badge}</span>
  {:else if muted}
    <span class="muted">{muted}</span>
  {/if}
</div>
