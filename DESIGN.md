# Design Brief

## Direction

Maison — a calm, paper-warm hospitality workspace where service data reads like a well-set menu: deep forest green, warm amber, generous rounded surfaces.

## Tone

Refined and restrained premium hospitality: quiet confidence, no decoration for its own sake, density where staff need it.

## Differentiation

A forest-green sidebar anchors a warm off-white canvas, with amber used only as a service signal (active nav, live bookings, key actions) so the eye always knows where to look.

## Color Palette

| Token      | OKLCH          | Role                                              |
| ---------- | -------------- | ------------------------------------------------- |
| background | 0.973 0.009 95 | warm off-white paper canvas                       |
| foreground | 0.245 0.018 158| deep green-black text                             |
| card       | 0.996 0.004 95 | near-white elevated surfaces                      |
| primary    | 0.405 0.058 160| forest green #1F4D3A — actions, sidebar, headings |
| accent     | 0.795 0.098 66 | warm amber #E8A45C — highlights, active states    |
| muted      | 0.944 0.012 92 | secondary surfaces, table stripes, input fills    |

## Typography

- Display: Figtree — headings, KPI numerals, venue name, section titles
- Body: Figtree — UI labels, tables, forms, body copy
- Mono: Geist Mono — times, prices, reference codes, tabular stats
- Scale: hero `text-3xl md:text-5xl font-bold tracking-tight`, h2 `text-xl md:text-2xl font-semibold tracking-tight`, label `text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground`, body `text-sm md:text-base`

## Elevation & Depth

Layered paper: background canvas, card surfaces with hairline warm borders and `shadow-subtle`, raised popovers and active cards with `shadow-elevated`; no glows.

## Structural Zones

| Zone    | Background        | Border            | Notes                                             |
| ------- | ----------------- | ----------------- | ------------------------------------------------- |
| Header  | bg-card           | border-b          | venue name, date/service stepper, primary CTA     |
| Sidebar | bg-sidebar        | border-r          | forest green, cream text, amber active bar        |
| Content | bg-background     | —                 | KPI row, then plan/timeline, alternating bg-muted/40 bands |
| Footer  | bg-muted/40       | border-t          | status line, language switch FR/EN                |

## Spacing & Rhythm

Page padding 16px mobile / 24px tablet, card gaps 16px, section gaps 32–48px, micro-spacing 4/8/12; dense table rows 44px tall for service use.

## Component Patterns

- Buttons: rounded-xl, forest green fill with cream text; secondary is bordered card surface; amber reserved for live/primary service actions; hover darkens one L step.
- Cards: rounded-xl (14px), bg-card, 1px border-border, shadow-subtle, hover shadow-elevated.
- Badges: pill shape, tinted backgrounds — success green, warning amber, destructive red, muted neutral; 11px uppercase tracking-wide.
- Inputs: rounded-lg, bg-card, border-input, focus ring-ring 2px.

## Motion

- Entrance: `animate-fade-up` 450ms cubic-bezier(0.22,1,0.36,1), staggered 60ms across cards.
- Hover: `transition-smooth` 300ms on color, border, shadow, transform.
- Decorative: `animate-pulse-soft` on live-service indicators only; no bouncing.

## Constraints

- Token-only colors; never raw hex, rgb, or arbitrary Tailwind color classes.
- Mobile-first, tablet-optimized for staff during service; touch targets ≥ 44px.
- French-first UI copy, English available; Inter-style geometric sans only (Figtree).
- Amber is a signal, not a surface fill; keep it under ~10% of any screen.
- Rounded-xl cards, no full-page gradients, no purple or blue accents.

## Signature Detail

A thin amber rail marks the active service and today's bookings, giving the whole workspace a single warm pulse against the calm forest-and-paper base.
