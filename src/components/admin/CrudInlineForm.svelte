<script lang="ts">
  import type { Snippet } from 'svelte';

  export type $$Events = {
    submit: SubmitEvent;
  };

  let {

    className = "",
    children,
    ...rest
  }: {
    className?: string;
    children?: Snippet;
    [key: string]: unknown;
  } = $props();
</script>

<form class={`form-row ${className}`.trim()} {...rest}>
  {@render children?.()}
</form>
