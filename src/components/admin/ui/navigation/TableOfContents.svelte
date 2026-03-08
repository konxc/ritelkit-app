<script lang="ts">
import { onMount } from "svelte";

interface TocItem {
  id: string;
  label: string;
}

interface Props {
  items: TocItem[];
  activeId?: string;
  class?: string;
  onItemClick?: () => void;
}

let { items, activeId = $bindable(""), class: className = "", onItemClick }: Props = $props();

onMount(() => {
  const sections = items
    .map((item) => document.getElementById(item.id))
    .filter(Boolean) as HTMLElement[];

  if (sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      // Find the first entry that is intersecting
      const visibleEntry = entries.find((entry) => entry.isIntersecting);
      if (visibleEntry) {
        activeId = visibleEntry.target.id;
      }
    },
    {
      rootMargin: "-100px 0px -40% 0px",
      threshold: 0.1,
    },
  );

  sections.forEach((section) => {
    observer.observe(section);
  });

  return () => {
    sections.forEach((section) => {
      observer.unobserve(section);
    });
  };
});

function handleClick(e: MouseEvent, id: string) {
  if (onItemClick) onItemClick();

  // Smooth scroll is handled by CSS usually, but we want to ensure focus if needed
  const target = document.getElementById(id);
  if (target) {
    // Offset scroll if header is sticky
    const offset = 100; // Adjust based on header height
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = target.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });

    // Update active state immediately for better response
    activeId = id;

    // Prevent original anchor jump to handle offset
    e.preventDefault();
  }
}
</script>

<nav class="flex flex-col gap-1.5 {className}">
  {#each items as item}
    <a
      href="#{item.id}"
      class="rounded-xl px-3 py-2 text-sm font-semibold transition-all"
      class:bg-stone-900={activeId === item.id}
      class:text-white={activeId === item.id}
      class:text-stone-500={activeId !== item.id}
      class:hover:text-stone-900={activeId !== item.id}
      class:hover:bg-stone-100={activeId !== item.id}
      onclick={(e) => handleClick(e, item.id)}
    >
      {item.label}
    </a>
  {/each}
</nav>
