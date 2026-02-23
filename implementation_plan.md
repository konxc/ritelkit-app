# Implementation Plan - Roti Sholawat Landing Page

Develop a modern, premium landing page for **Roti Sholawat**, a bakery located in Bantul, Yogyakarta. The site will showcase products, provide branch information, and offer a visual gallery of the bakery.

## Tech Stack
- **Framework**: Astro (latest)
- **UI Framework**: Svelte 5
- **Styling**: Vanilla CSS (Modern CSS with CSS Variables and Grid/Flexbox)
- **Deployment**: Cloudflare Pages (configured via `@astrojs/cloudflare`)

## Key Features
1. **Hero Section**: High-impact visual with the bakery's branding and a clear call to action (Order via WhatsApp).
2. **Product Categories**: Showcase "Roti Manis" and "Aneka Cake" with descriptions and pricing.
3. **Image Gallery**: A professional grid of the 21 photos provided in the `bahan` directory.
4. **Location & Contact**: Map-ready address (Bantul), operating hours, and direct WhatsApp link.
5. **SEO Optimization**: Proper meta tags, sitemap, and semantic HTML for local bakery discovery.

## Aesthetic Goals
- **Color Palette**: Warm bakery tones (Cream, Deep Brown, Golden Honey) with modern clean backgrounds.
- **Typography**: Elegant Serif for headings (e.g., Outfit or Playfair Display) and clean Sans-serif for body.
- **Micro-animations**: Smooth transitions on scroll and hover effects for product cards.

## Task Breakdown

### Phase 1: Foundation
- [ ] Set up global CSS with design tokens (colors, spacing, typography).
- [ ] Create a `MainLayout.astro` component with SEO meta tags.
- [ ] Initialize basic navigation and footer.

### Phase 2: Core Components
- [ ] **Hero**: Implement a responsive hero section.
- [ ] **Menu**: Create cards for Roti Manis and Aneka Cake.
- [ ] **Gallery**: Build a responsive image gallery using the `public` assets.
- [ ] **Contact**: Add the address and WhatsApp button.

### Phase 3: Content & Assets
- [ ] Move images from `bahan` to `public/images/`.
- [ ] Populate menu data from research (Mesis, Mocca, Blueberry, etc.).

### Phase 4: Polish & Refinement
- [ ] Add scroll animations.
- [ ] Verify mobile responsiveness.
- [ ] Optimize images for web performance.
