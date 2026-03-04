<script lang="ts">
  import { onMount } from "svelte";

  const initTestimonials = () => {
    const track = document.getElementById("testimonial-track");
    if (!track) return () => {};

    let index = 0;
    const items = track.children.length;
    const dots = Array.from(document.querySelectorAll<HTMLSpanElement>(".testimonial-dots span"));

    const setActiveDot = (activeIndex: number) => {
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === activeIndex);
      });
    };

    const advance = () => {
      index = (index + 1) % items;
      track.scrollTo({
        left: track.clientWidth * index,
        behavior: "smooth",
      });
      setActiveDot(index);
    };

    setActiveDot(0);
    const interval = setInterval(advance, 4500);

    const handleScroll = () => {
      const nextIndex = Math.round(track.scrollLeft / track.clientWidth);
      if (nextIndex !== index) {
        index = nextIndex;
        setActiveDot(index);
      }
    };

    const handleResize = () => {
      track.scrollTo({ left: track.clientWidth * index });
    };

    const stopInterval = () => clearInterval(interval);

    track.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    track.addEventListener("mouseenter", stopInterval);

    return () => {
      clearInterval(interval);
      track.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      track.removeEventListener("mouseenter", stopInterval);
    };
  };

  const setupPartnerTabs = () => {
    const tabBenefit = document.getElementById("tab-benefit");
    const tabCara = document.getElementById("tab-cara");
    const contentBenefit = document.getElementById("content-benefit");
    const contentCara = document.getElementById("content-cara");
    if (!tabBenefit || !tabCara || !contentBenefit || !contentCara) {
      return () => {};
    }

    const isDesktop = () => window.innerWidth >= 768;

    const showBenefitTab = () => {
      if (isDesktop()) return;
      tabBenefit.classList.add("bg-primary", "text-white", "border-transparent");
      tabBenefit.classList.remove("bg-white/60", "text-text-muted", "border-primary/10");
      tabCara.classList.add("bg-white/60", "text-text-muted", "border-primary/10");
      tabCara.classList.remove("bg-primary", "text-white", "border-transparent");
      contentBenefit.classList.remove("max-md:hidden");
      contentBenefit.classList.add("max-md:block");
      contentCara.classList.add("max-md:hidden");
      contentCara.classList.remove("max-md:block");
    };

    const showCaraTab = () => {
      if (isDesktop()) return;
      tabCara.classList.add("bg-primary", "text-white", "border-transparent");
      tabCara.classList.remove("bg-white/60", "text-text-muted", "border-primary/10");
      tabBenefit.classList.add("bg-white/60", "text-text-muted", "border-primary/10");
      tabBenefit.classList.remove("bg-primary", "text-white", "border-transparent");
      contentCara.classList.remove("max-md:hidden");
      contentCara.classList.add("max-md:block");
      contentBenefit.classList.add("max-md:hidden");
      contentBenefit.classList.remove("max-md:block");
    };

    const handleBenefit = () => showBenefitTab();
    const handleCara = () => showCaraTab();

    tabBenefit.addEventListener("click", handleBenefit);
    tabCara.addEventListener("click", handleCara);

    return () => {
      tabBenefit.removeEventListener("click", handleBenefit);
      tabCara.removeEventListener("click", handleCara);
    };
  };

  onMount(() => {
    const cleanupTestimonials = initTestimonials();
    const cleanupTabs = setupPartnerTabs();
    return () => {
      cleanupTestimonials();
      cleanupTabs();
    };
  });
</script>
