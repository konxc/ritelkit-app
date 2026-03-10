<script lang="ts">
  interface Props {
    value?: string | number;
    field: string;
    ariaLabel?: string;
    class?: string;
    title?: string;
    [key: string]: any;
  }

  let { value = "", field, ariaLabel = "", class: className = "", title, ...rest }: Props = $props();

  const baseClasses =
    "inline-block rounded-lg border border-stone-200/50 bg-stone-100/60 px-3 py-1.5 font-bold text-stone-900 transition-all outline-none hover:bg-white hover:border-[#c48a3a]/30 focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30";

  let computedClass = $derived(`${baseClasses} ${className}`);
</script>

<div
  contenteditable="true"
  role="textbox"
  tabindex="0"
  aria-label={ariaLabel}
  data-field={field}
  class={computedClass}
  {title}
  {...rest}
>
  {value}
</div>
