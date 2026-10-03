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
| M0 | F1 follow-ups: QuantityStepper uncontrolled max-lowering sync + draft/click test, FormField empty `controlId`, SpecList duplicate labels, `.env.example` + gitignore exception | Delegated (writer) | 3+ files | Done — in owner commit `4124624`; `.env.example` created by the owner and committed as `38a063e` |
| M1 | Catalog module: domain (Product, Variant, Category spec schema, Brand, Availability, ExpertReview) + Zod, `CatalogRepository` port, use cases (list/filter by category, get by slug, compare, search), mock adapter with the 19 fixtures (verify conflicting specs), `DATA_SOURCE` composition root | Delegated (writer) | 2+ non-trivial files | Done — `4124624` (partial, owner) + `de66e33` |
| M2 | App shell: layout, header (nav, SearchBar, cart button), footer (legal links, Libro de Reclamaciones), motion providers (Lenis/GSAP on discovery only), 404/error | Delegated (writer) | 2+ non-trivial files | Done — `5399153`, `bd23170`, `b2cbbbf` (branch `feat/f1-app-shell`) |
| M3 | Discovery: Home, Category (spec filters), Brand, Search results | Delegated (writer) | 2+ non-trivial files | Done — `fa9cdb7`, `55bbb1e`, `e441956`, `bf30562`, `31b1c49` (branch `feat/f1-discovery`) |
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

- 2026-10-02: M0 + M1 done. The owner committed and pushed partial work mid-writer as `4124624` (message from another project; not rewritten). Completion commit `de66e33`.
  - M0: QuantityStepper stores and notifies clamped uncontrolled values; FormField empty `controlId` falls back; SpecList throws on duplicate labels; `.gitignore` `!.env.example`. `.env.example` itself not created (permission deny on `.env*`); content: `DATA_SOURCE=mock`.
  - M1: Zod 4.6.5 domain (99 tests), use cases (21), mock adapter validating 19 fixtures (13), composition root with `server-only` (4). Apple split into `laptops`/`tablets`/`audio` (9 categories). 8 expert reviews incl. Revodok Pro 210 macOS mirroring. Spec checks: Prime 160W = 140 W single port; MagFlow 55960 = 25 W (iPhone 16/17); Nano 45W = A121D. Estimated prices marked `// price: estimated`.
  - Writer verification: install, lint, typecheck, test (569), build, build-storybook ok. Parent spot check: `pnpm test` 569 passed; `pnpm lint` ok.
  - Notes for later: M4 `next/image` with SVG placeholders needs `unoptimized`/`dangerouslyAllowSVG`; M5 may move `DATA_SOURCE` parsing to `src/shared/lib`.

  - Review: the full range (4,644 lines) exceeded the native lens budget; unpushed commits were re-split (identical tree). Slice 1 `4d61dd9..457e826` approved (`review-8b51716ca51353f0`); slice 2 `457e826..d277044` approved (`review-db5a3c8e0341d09f`). `38a063e` (`.env.example`, 2 lines) under budget, unreviewed.
  - Advisories scheduled: freeze shared mock data (M2); URL filter validation + empty `pageSize` (M3); `compareProducts` missing-category error test (M4).
- 2026-10-02 night: owner authorized an autonomous overnight run (M2..M9) without confirmations; only restriction: stop at 95% context. Native review disabled for this clone only (`gentle-ai review mode disable --scope clone`); re-enable in the morning with `gentle-ai review mode enable --scope clone`. Verification per Delegated Verification Gate (assess tier; independent verifier for high risk) + parent spot check. Stacked branches: `feat/f1-app-shell` (M2) from `feat/f1-catalog-domain`, then one branch per task.

## Decisions to review (overnight)

Decisions made without the owner during the overnight run, within approved design and scope. Review each in the morning.

- M2: Header reads the current path itself (`usePathname`) instead of receiving it as a prop.
- M2: Search is a native GET form to `/buscar` (works without JS), enhanced to client navigation.
- M2: Cart is a link to `/carrito` named "Carrito, N productos" (badge only above 0, caps at "99+"); M5 may turn it into the drawer trigger.
- M2: Error pages use Next 16.3's stable `retry` prop; `global-error.tsx` added.
- M2: Sheet primitive written by hand from shadcn's source (no CLI, to protect `globals.css`).
- M2: Desktop wordmark at `text-body` weight 500; category nav in a second header row.

- M3: URL format — repeated params for lists; no-JS range fields `<spec>-desde`/`<spec>-hasta`; single number = exact value; param names in `SPEC_PARAM_NAMES` (e.g. `anc` → `cancelacion-ruido`).
- M3: Canonical URLs built on the client (Zod in the category bundle); no redirects for raw no-JS URLs.
- M3: Filter groups that cannot narrow results are hidden; boolean specs grouped under "Características"; three sorts (relevancia, precio asc/desc).
- M3: Native checkboxes (Radix checkbox does not submit before hydration); no-JS filters via Tailwind `noscript:` + `#filtros` target.
- M3: "Destacados" = one in-stock product per category first; hero CTA → first category; hero, "Por qué Migeanje" and "En importación" copy marked DRAFT.
- M3: Brand descriptions generated from data; brand groups link to the category filtered by brand. Search results `noindex`; title template `%s · Migeanje Store`.

## M3 evidence

- RED → GREEN per item (13 failing advisory tests first). Writer verification: install, lint (268 files), typecheck, test (839), build, build-storybook ok. Headless axe: 0 violations on 6 pages × 375/1280px × normal/reduced motion; no horizontal scroll at 375px; filters and sort work without JS.
- Parent spot check: `pnpm test` 839 passed; `pnpm lint` ok. Risk tier: medium (`ad89fd1..HEAD`, 6,900 lines).
- Open: without JS, `/buscar` shows the empty header search (Suspense fallback); nothing links to `/marcas/*` yet (M4 should); pagination never appears with 12 per page and current data.

## M2 evidence

- RED → GREEN: catalog advisory fixes (4 failing tests first); every new test file observed RED first. Deps: `gsap@3.15.0`, `lenis@1.3.26`.
- Writer verification: install, lint (182 files), typecheck, test (616), build, build-storybook ok. Headless axe (real Chrome, contrast on): 0 violations on home and 404 at 375px and 1280px, and with the mobile menu open.
- Parent spot check: `pnpm test` 616 passed; `pnpm lint` ok. Risk tier: medium (assess over `d277044..HEAD`), writer self-verification + spot check.
- Gotchas: Lenis ignores Radix scroll locking → `data-lenis-prevent` on sheet panel and overlay; Lenis `anchors` must stay off so the skip link moves focus.

## Next step

M4 (product page + comparator) on `feat/f1-product`.
