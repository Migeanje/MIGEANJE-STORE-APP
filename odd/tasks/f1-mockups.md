# F1 — Functional mockups (Migeanje Store storefront)

## Objective

Functional mockups of the MVP storefront running on `DATA_SOURCE=mock`: a catalog module with ports and adapters, 19 real-product fixtures, the MVP sitemap screens and the 5 key flows — without backend.

## Problem / Why

The design system (`f1-design-system`) is done and on `main`. F1 objectives 3 and 4 remain: prove the UX of the store end-to-end with realistic data before F2 (contracts and domain modeling) and F3 (Medusa). Mock adapters must be swappable for Medusa adapters later with zero UI rewrite (Engram #15, 3.5).

## Scope

- In: catalog, cart, checkout, orders, complaints (Libro de Reclamaciones), account and editorial screens on mock data; app shell; the 5 key flows; F1 design-system follow-ups.
- Out: real backend, real payments (Culqi simulated), real email, analytics, deploy.

## Key flows (Engram #20, corrected by #33)

1. Discover → compare → buy.
2. Buy a backorder product with visible lead time.
3. Guest checkout with boleta (DNI or CE); factura/RUC built but behind a disabled flag.
4. Track an order (public: order number + email; shows "En importación").
5. File a complaint (Libro de Reclamaciones).

## Constraints

- Mobile-first; WCAG 2.2 AA; `prefers-reduced-motion`; GSAP/Lenis only on discovery pages (Engram #44).
- Customer copy in neutral Peruvian Spanish with "tú"; code/docs in English.
- Brand names descriptive only; no brand logos as part of our identity. Product images in mocks are neutral placeholders (no manufacturer photography).
- Money in integer céntimos (`formatPEN`). Availability: `in_stock | backorder{leadTimeDays} | unavailable`.
- Architecture per #15 3.5: `src/app` thin routes; `src/modules/<context>/{domain,application,infrastructure,ui}`; `DATA_SOURCE=mock|medusa`.
- Catalog: 19 approved products (Engram `product/mock-catalog`, `product/catalog-candidates`); Apple group = future line (regime B), shown as "Avísame".

## Tasks

| ID | Task | Route | Trigger evidence | Status |
|---|---|---|---|---|
| M0 | F1 follow-ups: QuantityStepper uncontrolled max-lowering sync + draft/click test, FormField empty `controlId`, SpecList duplicate labels, `.env.example` + gitignore exception | Delegated (writer) | 3+ files | Pending |
| M1 | Catalog module: domain (Product, Variant, Category spec schema, Brand, Availability, ExpertReview) + Zod, `CatalogRepository` port, use cases (list/filter by category, get by slug, compare, search), mock adapter with the 19 fixtures (verify conflicting specs), `DATA_SOURCE` composition root | Delegated (writer) | 2+ non-trivial files | Pending |
| M2 | App shell: layout, header (nav, SearchBar, cart button), footer (legal links, Libro de Reclamaciones), motion providers (Lenis/GSAP on discovery only), 404/error | Delegated (writer) | 2+ non-trivial files | Pending |
| M3 | Discovery: Home, Category (spec filters), Brand, Search results | Delegated (writer) | 2+ non-trivial files | Pending |
| M4 | Product page (gallery, variants, specs, availability, expert review rubric, compare) + Comparator | Delegated (writer) | 2+ non-trivial files | Pending |
| M5 | Cart module (domain, mock adapter, server actions, cookie) + cart drawer | Delegated (writer) | 2+ non-trivial files | Pending |
| M6 | Checkout 3 steps (contact + shipping with ubigeo, receipt boleta / factura flag off, simulated Culqi payment) + order confirmation | Delegated (writer) | 2+ non-trivial files | Pending |
| M7 | Orders: public order status ("En importación") | Delegated (writer) | 2+ non-trivial files | Pending |
| M8 | Libro de Reclamaciones form + constancia | Delegated (writer) | 2+ non-trivial files | Pending |
| M9 | Account (login/register/reset, profile, addresses, my orders, favorites) + trust & legal pages ("Cómo elegimos", terms, privacy, shipping & returns, warranties) | Delegated (writer) | 2+ non-trivial files | Pending |

## Acceptance criteria

- `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build-storybook` pass.
- The 5 key flows can be completed in the browser on mock data at 375px and 1280px.
- No UI component imports an infrastructure adapter directly; swapping `DATA_SOURCE` only changes the composition root.
- Every new component has tests (incl. axe) and a story.

## Checks

- Test-first for domain, use cases, money and cart/checkout logic (RED before GREEN).
- Pages: structural checks (build, axe in component tests) plus flow tests where deterministic.

## Delivery

- Forecast: several thousand authored lines → above the ~400 line budget.
- Strategy: `ask-on-risk`; chain strategy per Engram #21 10.1: one short branch per slice from `main`, PR + squash merge by the owner.
- Current slice branch: `feat/f1-catalog-domain` (M0 + M1).

## Progress

- 2026-10-02: Product list researched and approved (19 products). Branch `feat/f1-catalog-domain` created from `main` (`4d61dd9`). Feature document created.

## Next step

M0 + M1 (one writer, separate work-unit commits).
