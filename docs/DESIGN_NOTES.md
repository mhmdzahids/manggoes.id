# Design Notes: Manggoes Website

antislop active: during (session override).
Reading this as: one-page marketing landing page for Indonesian premium mango brand (Manggoes), with an editorial orchard aesthetic faithfully recreating reference.png, leaning toward vanilla CSS tokens + semantic HTML.

## 1. Section Architecture
1. **Header (`#mg-header`)**: Floating rounded pill container detached with margins. Left hamburger button and navigation links (Katalog, Tentang Kami, Produksi, Kontak). Center Manggoes logo. Right phone contact and dark green "Hubungi Kami" pill.
2. **Hero (`#mg-hero`)**: Full-bleed orchard photography inside a 36px rounded container. 3-line Indonesian headline ("Manis yang bikin / jatuh hati"), concise subline, dark green "Unduh Daftar Harga" CTA with download icon. Bottom features two frosted glass floating cards: "Kebun Ramah Lingkungan" and "Dari kebun sampai kemasan" thumbnail card.
3. **Varieties (`#mg-varietas`)**: Split layout with left dark green panel (`--mg-green-900`) showcasing variety count, heading, and catalog ghost button. Right side features a smooth horizontal scroll-snap carousel of tall rounded variety cards (Harum Manis, Gedong Gincu, Arumanis, Manalagi, Golek, Indramayu) with pagination dots, card arrow buttons, and lower prev/next controls.
4. **Stats Bar (`#mg-statistik`)**: Rounded strip in `--mg-cream-100` with 4 key metrics (land area, annual harvest, cultivation experience, distribution partners) featuring animated count-up on view.
5. **Pendekatan Kami (`#mg-pendekatan`)**: Left column detailing three quality commitments (quality control, stable-temperature modern storage, eco-friendly farming). Right column features a large video card with sorting crate photography, centered play trigger modal, and bottom-right harvest season badge.
6. **Ulasan Pelanggan (`#mg-ulasan`)**: Dark green-900 full-width rounded band with faint orchard overlay, heading and ghost CTA button, containing 3 customer review cards (Google Maps style) with 44px avatar initial circles, 5-star rating, and concrete Indonesian feedback.
7. **Footer (`#mg-footer`)**: Dark green-900 footer anchoring the page with logo, brand tagline, navigational links, contact directory, inline SVG social icons, and copyright notice.

## 2. Spacing Scale
- `--mg-space-2xs`: 4px
- `--mg-space-xs`: 8px
- `--mg-space-sm`: 12px
- `--mg-space-md`: 16px
- `--mg-space-lg`: 20px
- `--mg-space-xl`: 24px
- `--mg-space-2xl`: 32px
- `--mg-space-3xl`: 40px
- `--mg-space-4xl`: 48px
- `--mg-space-5xl`: 64px
- `--mg-space-6xl`: 80px
- `--mg-space-7xl`: 96px

## 3. Border Radius Scale
- `--mg-radius-xs`: 4px (micro badges, inputs)
- `--mg-radius-sm`: 8px (small cards, buttons)
- `--mg-radius-md`: 16px (thumbnails, inner cards)
- `--mg-radius-lg`: 24px (stat bar, modal, glass cards)
- `--mg-radius-xl`: 36px (main containers, hero, section cards)
- `--mg-radius-pill`: 9999px (pills, circular buttons, badges)

## 4. Typography Scale
- Headings Family: 'Plus Jakarta Sans', system-ui, sans-serif (font-weight: 600, 700, 800)
- Body Family: 'DM Sans', system-ui, sans-serif (font-weight: 400, 500)
- Display H1: clamp(2.25rem, 4.5vw, 4rem) | line-height: 1.08 | letter-spacing: -0.03em
- Section H2: clamp(1.75rem, 3.2vw, 2.75rem) | line-height: 1.15 | letter-spacing: -0.025em
- Card H3: clamp(1.2rem, 1.8vw, 1.5rem) | line-height: 1.25 | letter-spacing: -0.015em
- Subtitle / Lead: clamp(1rem, 1.2vw, 1.15rem) | line-height: 1.5
- Body Text: 0.95rem to 1rem (15px-16px) | line-height: 1.6
- Small / Caption: 0.85rem (13.5px) | line-height: 1.5
- Tag / Eyebrow: 0.75rem (12px) | line-height: 1.3 | letter-spacing: 0.08em

## 5. Color Palette & Tokens
- `--mg-green-900: #1F3A14` (Deep forest green; section panels, footer, dark cards)
- `--mg-green-700: #2F5A1E` (Primary button fill, prominent accents)
- `--mg-green-500: #5B9A3A` (Brand identity green; checkmarks, icons, badges)
- `--mg-green-100: #E6EFD9` (Soft green tint for subtle surfaces)
- `--mg-mango-500: #F4A21B` (Logo mango gold; accent fills, active dots, play button ring)
- `--mg-mango-600: #E0880B` (Mango hover state)
- `--mg-mango-100: #FDEBC8` (Soft mango background tint)
- `--mg-cream-50: #F7F3E8` (Canvas background)
- `--mg-cream-100: #EFE9D6` (Stat bar, secondary card surfaces)
- `--mg-ink-900: #1E2A17` (Primary body text; deep forest ink)
- `--mg-ink-600: #46553F` (Secondary body text and subtle labels)
- `--mg-white: #FFFFFF` (Pure white highlights, card grounds)
- `--mg-glass-bg: rgba(255, 255, 255, 0.75)`
- `--mg-glass-border: rgba(255, 255, 255, 0.45)`
- `--mg-glass-shadow: 0 8px 32px rgba(31, 58, 20, 0.08)`
