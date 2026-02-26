<script lang="ts">
  import type { Snippet } from "svelte";

  export type $$Events = {
    submit: SubmitEvent;
  };

  let {
    className = "",
    isSubmitting = false,
    children,
    ...rest
  }: {
    className?: string;
    isSubmitting?: boolean;
    children?: Snippet;
    [key: string]: unknown;
  } = $props();
</script>

<form
  class={`form-row ${className} ${isSubmitting ? "opacity-60 pointer-events-none" : ""}`.trim()}
  {...rest}
>
  {@render children?.()}
</form>
