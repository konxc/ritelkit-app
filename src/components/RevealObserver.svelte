<script lang="ts">
  import { onMount } from "svelte";

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12 },
    );

    const elements = document.querySelectorAll<HTMLElement>(".reveal");
    elements.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  });
</script>
