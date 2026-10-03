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
| M4 | Product page (gallery, variants, specs, availability, expert review rubric, compare) + Comparator | Delegated (writer) | 2+ non-trivial files | Done — `28ba3c0`, `abdce1c`, `8860bcb` (branch `feat/f1-product`) |
| M5 | Cart module (domain, mock adapter, server actions, cookie) + cart drawer | Delegated (writer) | 2+ non-trivial files | Done — `07924cb`, `90f6d16`, `fb508d9`, `6376e3f` (branch `feat/f1-cart`); high risk → independent verifier |
| M5.1 | Restore cached catalog pages (Engram #15 3.1): reading the cart cookie in the root layout made every route dynamic; fix via `cacheComponents` + Suspense around the cart slot, or a client-fetched cart count | Delegated (writer) | `next.config.ts` + layout | Pending |
| M6 | Checkout 3 steps (contact + shipping with ubigeo, receipt boleta / factura flag off, simulated Culqi payment) + order confirmation | Delegated (writer) | 2+ non-trivial files | Done — `6a922df`, `6cf956f`, `d1c5431`, `9202edc`, `3a5af7c` (branch `feat/f1-checkout`); payments/PII → independent verifier |
| M6.1 | Payment guard from M6 verification: expected total posted by the pay form and `cart_changed` refusal; validate/build order and reserve its number before charging | Delegated (writer) | checkout + orders | Done — `7d5c4e8` (branch `feat/f1-payment-guard`); verifier PASS |
| M7.1 | Hardening from M7/M6.1 verification: throttle key not trusting spoofable `x-forwarded-for`; throttle `unlockOrderAction`; block re-payment after `order_persist_failed_after_charge` (pending reconciliation notice on `/checkout/pago`) | Delegated (writer) | orders + checkout | In progress |
| M7 | Orders: public order status ("En importación") | Delegated (writer) | 2+ non-trivial files | Done — `465ed20`, `6b411ff`, `1709039` (branch `feat/f1-orders`) |
| M8 | Libro de Reclamaciones form + constancia | Delegated (writer) | 2+ non-trivial files | Done — `9dabc9f`, `2abe1f9`, `345808b` (branch `feat/f1-complaints`) |
| M9a | Trust & legal pages: "Cómo elegimos", términos, privacidad, envíos y devoluciones, garantías (DRAFT, research-backed) | Delegated (writer) | content + templates | In progress |
| M9b | Account mock: login/register/reset, profile, addresses, my orders, favorites | Delegated (writer) | 2+ non-trivial files | Pending |

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

- M4: Variant URL `?variante=<sku lowercase>` (default variant has none); reading it makes the product page render per request.
- M4: Option availability follows the choices above it; sold-out values blocked only while something else is buyable (Apple stays selectable). No color swatches yet (no color data; no literals allowed).
- M4: Quantity limits 5 (in stock) / 2 (backorder). "Avísame" hidden without JS (note instead). "Comparar" only on the product page (keeps the stretched-link card). Opening a shared comparator URL replaces the tray.
- M4: One schema.org offer for the selected variant (relative URLs). No `next.config.ts` change for SVG (Next serves `.svg` unoptimized). Backorder explainer, "Avísame" and cart messages marked DRAFT.
- M4: Apple future line reuses the "Agotado" label (could become "Próximamente").

- M5: Mixed carts (in stock + backorder) ship together when everything is available; overall lead time = max of backorder lines.
- M5: Over-limit adds clamp and explain; a line already at the limit is refused; removing a missing line counts as success. Quantity limits now live in the cart domain and in the product page `MAX_QUANTITY` (duplication to unify).
- M5: Header count via a `cart` slot (catalog does not import cart); drawer opened through `AddToCartFeedbackProvider`; header link becomes a button after hydration; drawer closes on navigation.
- M5: Cart lines snapshot name/image/href (`?variante=`). All new copy marked DRAFT. **Regression to fix (M5.1):** cookie read in the root layout makes every route dynamic, against #15 3.1.

- M6: Order numbers `MG-2026-` + 6 random digits (non-sequential, hides sales volume). `en_importacion` reached at payment for backorder orders.
- M6: Any price/availability/limit change blocks payment (nothing charged, cart refreshed for review). No card data stored, not even last four digits. Demo mode accepts only the two test cards.
- M6: Mobile phone = 9 digits starting with 9. Factura flag off → receipt step only confirms the boleta; flag in `src/shared/config/features.ts`.
- M6: Confirmation cookie `mg_order` lasts 1 hour; afterwards the order opens with number + email. Delivery dates skip weekends but not public holidays. Shipping: Lima S/ 10, Callao S/ 12, rest S/ 20 (DRAFT). Mock ubigeo: 25 departamentos + subset of provincias/distritos (some Piura/Arequipa codes to verify against INEI).

- M7: Lookup via POST (email never in URL), normalized numbers, neutral error, in-memory throttle 10 failures / 15 min per client key (real rate limiting belongs to the edge/backend). Success reuses `mg_order` (1 h) and redirects to `?numero=`; "Consultar otro pedido" clears it.
- M7: Public page masks PII (first name + initial, street prefix, no DNI/RUC, `a•••@dominio`); number + email still open the full M6 confirmation, so masking is not stronger protection. Page `noindex`.
- M7: Demo orders (mock only) for `demo@migeanje.pe`: `MG-2026-480315` (en importación), `MG-2026-275904` (en camino), `MG-2026-913628` (entregado).

- M6.1: Quote = expected total + 32-bit FNV-1a cart fingerprint (compare only; server charges its own total). If clearing the cart fails after saving the order, the order still counts. Reconciliation log exists only for mock (lost on restart; the structured log event is the lasting record).
- M8: Sheet number follows the official form `000000001-2026` (yearly correlative). Required fields limited to those whose absence voids a claim (name, document, address, email, detail, type, declaration). Added "how to receive the answer" (email or letter). Minors: guardian name required, no guardian document (data minimization). Truthfulness checkbox required (lawyer to confirm). DNI/CE only (as the official form). Order number not validated against real orders (no existence leak). Print theme added to `tokens.css` via `var()` aliases (screen tokens unchanged).

## M8 evidence

- Legal sources: Ley 29571 arts. 150–151 (amended by Ley 32495), Ley 31435 (15 business days, non-extendable), D.S. 101-2022-PCM (Anexo I, arts. 4-B, 5, 6, 6-B, 12). Engram `legal/libro-de-reclamaciones`.
- Writer verification: lint, typecheck, test (1,808 ×2), build, build-storybook ok. Headless axe: 0 violations (empty, error, filed, constancia incl. print emulation, no-JS) at 375/1280px.
- Parent spot check: `pnpm test` 1,808 passed; `pnpm lint` ok (619 files).
- Before launch: RUC, razón social and address "Por definir"; holidays not counted (due date may show early, never late); in-memory book violates 2-year retention (real storage in F3); no filing rate limit; RM 244-2026-PCM draft status unconfirmed.

## M6.1 + M7 verification

- Independent verifier (worktree at `7d5c4e8`): **PASS**. MEDIUM → M7.1: spoofable `x-forwarded-for` throttle key (bypass + lockout, reproduced); `unlockOrderAction` unthrottled; re-payment possible after `order_persist_failed_after_charge`.

## M7 evidence

- RED → GREEN per item. Writer verification: lint (552 files), typecheck, test (1,632 ×2), build, build-storybook ok. Headless: 19 axe checks with 0 violations, 81/81 flow checks (demo orders, real in-stock and backorder orders, no-JS lookup, throttle).
- Parent spot check: `pnpm test` 1,632 passed; `pnpm lint` ok. Independent verifier to run on M6.1 + M7 together.
- M6 independent verifier: **PASS**; MEDIUM (reproduced) charge can exceed the shown "Pagar" amount after a cart change in another tab → M6.1; card charged before order validation/save (retry could double charge) → M6.1 partial, idempotency key in F4.

## M6 evidence

- RED → GREEN per layer. Deps: `react-hook-form@7.89.0`, `@hookform/resolvers@5.9.1`. Writer verification: install, lint (524 files), typecheck, test (1,557–1,558; one run hit the known flaky timeout), build, build-storybook ok. Headless: 18 axe checks with 0 violations, 60/60 flow checks (in-stock Lima declined→approved card → confirmation → cart 0; backorder Arequipa with lead time; no-JS contact and receipt steps).
- Parent: raised Vitest `testTimeout` to 20 s (`3603fbc`) — the flaky category axe test timed out at 5 s under parallel load (independent verifier confirmed the cause); full suite 1,558 passed 3/3. `pnpm lint` ok.
- Open: concurrent double payment not prevented (needs a Culqi idempotency key in F4); `deepFreeze` duplicated in catalog and shared; `/terminos` and `/pedidos/seguimiento` pending (M9, M7).
- M5 independent verifier (worktree at `6376e3f`): **PASS**. Medium follow-ups: lost updates under concurrent cart writes (F3), in-memory carts never expire (guard against production use of mock), add-at-limit keeps a stale line availability (checkout re-prices).

## M5 evidence

- RED → GREEN: domain (44), application (22), infrastructure (35), actions (37). Writer verification: install, lint (411 files), typecheck, test (1,280 ×2), build, build-storybook ok. Headless axe: 0 violations in 12 checks (375/1280px); 18/18 flow checks; add-to-cart and remove work without JS.
- Parent spot check: `pnpm test` 1,280 passed; `pnpm lint` ok. Stopped a leftover `next start -p 3100`. Risk tier: **high** (`hot_path` on cart update) → independent verifier on an isolated worktree at `6376e3f`.
- M6 extension point: `loadCart()` from `@/modules/cart/ui/cart-data` (server-only, per-request cache) → `Cart | null`; totals via `summarizeCart(cart.lines)`; clear via `clearCart(getCartRepository(), await readCartId())`; checkout must re-price through `getProductLookup()` before payment.

## M4 evidence

- RED → GREEN: 12 logic test files (31 failing tests first). Writer verification: install, lint (342 files), typecheck, test (1,070), build, build-storybook ok. Headless axe: 0 violations in 34 checks (3 product pages, 4 comparator states, tray and notify-me interactions; 375/1280px; normal/reduced motion); variant links and differences toggle work without JS.
- Parent spot check: `pnpm test` 1,070 passed twice; `pnpm lint` ok. Risk tier: medium (`72afdf5..HEAD`, 6,391 lines). Stopped a leftover `next start` (port 3123) left by the writer.
- Open: one writer run saw the category page container axe test fail once (not reproduced in 3 later runs; cause unknown, possibly load-related timeout); after "Vaciar" the compare bar disappears and focus falls to the body.
- M5 extension point: `AddToCartAction = (previous, formData) => Promise<{ ok, message }>` (`useActionState`), fields `sku` and `cantidad` via `parseAddToCartForm`; route passes `addToCart={addToCartAction}` to `ProductPageContainer`.

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

M7.1 + M9a on `feat/f1-trust-pages`; then M9b + M5.1.
