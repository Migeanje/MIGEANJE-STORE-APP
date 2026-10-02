# ADR 0001 — Visual identity: "night greenhouse"

- Status: Accepted
- Date: 2026-10-02
- Deciders: Owner, Claude (F1 design conversation)
- Engram: `design/visual-concept`, `design/typography`, `design/accent-color`, `design/color-mode`, `design/status-colors`, `design/radii`, `design/motion`, `design/foundations-approval`

## Context

Migeanje Store sells premium tech accessories (UGREEN, Anker and similar) in Peru. The planning phase fixed the principles (contained premium retail in the spirit of Apple and Nothing, product photography first, one accent color, typographic structure inspired by bleibtgleich.dev, WCAG 2.2 AA, mobile-first, `prefers-reduced-motion`). The owner wanted an avant-garde identity that is recognizably ours and that "warms up" technology, which reads as cold: dark tones, warm yellow LED light and touches of plants.

Constraints that shaped the decision:

- Brand names are descriptive only; no third-party logos or brand colors in our identity. UGREEN's brand color is green; Mercado Libre's is lemon yellow (`#FFE600`).
- A yellow accent fails contrast on white (1.73:1 for `#FCBA03`), but passes easily on warm near-black (11.18:1 on `#0F0E0C`).
- Manufacturer packshots ship on white backgrounds.

## Decision

1. **Concept — "night greenhouse".** Technology is precise; light is warm. Warm graphite surfaces, lots of negative space, the product as protagonist, lit by warm amber LED light.
2. **One UI accent: amber `#FCBA03`** (`primary` in code). It marks what is active, selected or actionable ("light on"). Use it in small areas and as a low-alpha glow, never as large fills.
3. **Green lives only in art direction** (plants and nature in hero and editorial photography). Never in UI tokens, buttons or product cards. Enforced by `tokens.test.ts`.
4. **Dark-only MVP** with semantic tokens (shadcn variable names), so a light theme later only redefines `:root` values.
5. **Typography — Geist Sans + Geist Mono** (self-hosted `geist` package). Geist Sans 500 for display with a two-extreme scale (display-xl 2.75→6rem, leading 0.9, tracking −0.04em); body 16px / 1.5 (deliberately not bleibtgleich's 100% body leading). Geist Mono only for data: specs, lead times, order numbers, SKUs.
6. **Availability as an LED indicator.** In stock = filled amber dot with glow; backorder = amber ring; unavailable = gray ring (`led-off`). The label text is always shown (WCAG 1.4.1). Errors use warm red `#FF7A6B`; no amber warnings.
7. **Soft radii mirroring the products.** sm 6px (tags, chips), md 12px (inputs, thumbnails), lg 20px (cards, panels), pill (buttons), full 50% (LED, avatars). Nested corners are concentric (inner = outer − padding).
8. **Motion explains, never decorates.** One signature gesture, "encendido" (the amber glow turns on at hover/focus/selection). Durations 120/240/480/800ms; ease-out `cubic-bezier(0.16, 1, 0.3, 1)`. GSAP/Lenis only on discovery pages; native scroll in checkout, account and legal pages. Reduced motion keeps state changes but makes them instant. No loader: the hero "warms up" while content is already usable.

Approved token values live in `src/shared/ui/tokens/tokens.css`; the owner reviewed them in Storybook (Foundations) on 2026-10-02.

## Consequences

- Dark-first is an accessibility requirement, not only aesthetics: the accent cannot be reused on light surfaces without a second, darker variant.
- Product imagery needs transparent cutouts and a warm glow behind them; black products need rim light. This is the main ongoing content cost.
- Warning states need their own treatment (backorder reads as good news on the way, not as a warning).
- Changing token values requires owner approval and green contrast tests.
- Rejected alternatives: Archivo (closer to Akzidenz, no mono sibling); sharp industrial corners (colder); dot-matrix fonts (too close to Nothing, poor small-size legibility); `#FFC247` (owner preferred the deeper `#FCBA03`); a counter loader on first visit.
