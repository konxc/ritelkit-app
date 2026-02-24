<script lang="ts">
  let {
    className = "",
    ...rest
  }: {
    className?: string;
    [key: string]: unknown;
  } = $props();
</script>

<form class={`form-row ${className}`.trim()} {...rest}>
  <slot />
</form>
