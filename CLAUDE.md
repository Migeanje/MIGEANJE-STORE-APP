# CLAUDE.md — Migeanje Store storefront

Next.js storefront for Migeanje Store, a premium tech accessories shop for Peru (prices in PEN, UI in Spanish).

## Start here

1. Search Engram project `migeanje-store` before doing anything else in a conversation.
2. Design decisions live in Engram topics `design/*` and in `docs/adr/`. Read them before touching UI or architecture.
3. Feature progress lives in `odd/tasks/<feature>.md`.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build (also type-checks) |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Biome lint + format check (no writes) |
| `pnpm lint:fix` | Biome check with safe fixes applied |
| `pnpm format` | Biome format with writes |
| `pnpm typecheck` | Generate Next.js route types, then `tsc --noEmit` |
| `pnpm test` | Vitest, single run |
| `pnpm test:watch` | Vitest, watch mode |
| `pnpm storybook` | Storybook dev server on http://localhost:6006 |
| `pnpm build-storybook` | Static Storybook build into `storybook-static/` |

CI (`.github/workflows/ci.yml`) runs install (frozen lockfile), lint, typecheck, test, build and build-storybook on every PR and on push to `main`.

## Stack

- Next.js (App Router) + React, TypeScript strict, `src/` directory, alias `@/*` -> `src/*`.
- Tailwind CSS v4 (CSS-first config, `@theme` tokens).
- pnpm (version pinned in `packageManager`); Node from `.nvmrc`.
- Biome for lint and format. No ESLint, no Prettier.
- Vitest + Testing Library (jsdom). Tests live next to the code as `*.test.ts(x)`.
- Fonts: Geist Sans + Geist Mono from the self-hosted `geist` package (`next/font/local`, no network at build) in `src/shared/ui/tokens/fonts.ts`.
- Storybook (`@storybook/nextjs-vite`) with the a11y and docs addons; config in `.storybook/`.
- Components: `class-variance-authority` variants, `cn()` (clsx + tailwind-merge), `lucide-react` icons, `radix-ui` (Slot and shadcn primitives), `axe-core` in tests.
- Motion: `gsap` (ScrollTrigger) + `lenis`, only on discovery pages (see App shell).

## Architecture

```
src/
  app/                 thin routes: compose module containers, no business logic
  modules/<context>/
    domain/            own types + Zod schemas
    application/       use cases
    infrastructure/    adapters: *.mock.ts (fixtures) | *.medusa.ts (js-sdk)
    ui/                containers (Server Components) + presentational components
  shared/ui/           atomic design: atoms, molecules, organisms, templates
```

- Contexts: `catalog`, `cart`, `checkout`, `account`, `orders`, `complaints`, `editorial`, `procurement-status`.
- `DATA_SOURCE=mock|medusa` selects the infrastructure adapters.
- Routes are in Spanish: `/productos/[slug]`, `/categorias/[slug]`, `/marcas/[slug]`.
- Create module folders only when they get their first file (git does not track empty folders).

## Modules

- Layout per context, e.g. `src/modules/catalog/`: `domain/` (types + Zod schemas + pure rules such as derived price, availability, filters, facets, search), `application/` (the port `catalog-repository.ts` + use cases), `infrastructure/` (adapters + composition root), `ui/`, and `testing/` (test-only builders).
- Ports and adapters: use cases take the port (`CatalogRepository`) as their first argument and never import `infrastructure/`. Adapters implement the port; `createInMemoryCatalogRepository` holds the reference semantics for filters, sort and search.
- Composition root: `infrastructure/index.ts` (`getCatalogRepository()`, marked `server-only`) picks the adapter from `DATA_SOURCE` (`mock` when unset; `medusa` throws until F3). Only Server Components and server actions call it; UI components receive data, never adapters. Tests mock `server-only` with `vi.mock("server-only", () => ({}))`.
- `DATA_SOURCE=mock|medusa`: copy `.env.example` to `.env.local`.
- Fixtures (`infrastructure/fixtures/*.ts`) are parsed with the domain `catalogSchema` when `catalog.mock.ts` loads, so a bad fixture fails at startup; `catalog.mock.test.ts` asserts they parse. Mark guessed prices with `// price: estimated`. Product images in mocks are the neutral silhouettes in `public/mock/products/<category>.svg`.
- Money is integer céntimos everywhere (`moneySchema` = the `formatPEN` rules); product price and availability are derived from the variants (`productPrice`, `productAvailability`), never stored.
- Domain errors fail loudly with a clear message; user input (URL filters, pages, search text) is sanitized or clamped instead.
- Domain and use-case tests run in Node: start them with `// @vitest-environment node`.
- Adapters return shared, deeply frozen data (`deepFreeze` in `infrastructure/`): mutating a returned entity throws a TypeError. Copy before changing anything.

## App shell

- Root layout (`src/app/layout.tsx`): skip link "Saltar al contenido" -> `<main id="contenido" tabIndex={-1}>`, between `SiteHeaderContainer` and `SiteFooterContainer` (`src/modules/catalog/ui/`, they load the categories and render the shared organisms).
- Route groups: `(discovery)` (home, category, product, brand, search) wraps pages in `MotionProvider` (`src/shared/ui/providers`: Lenis on the window, driven by GSAP's ticker and synced with ScrollTrigger). `(transactional)` (cart, checkout, account, orders, complaints, legal) keeps native scroll. New pages go in the matching group.
- Lenis honors `prefers-reduced-motion` by itself; GSAP animations must use `gsap.matchMedia()` and stay off under reduced motion. Lenis anchors stay off so the skip link moves focus. Scrollable overlays carry `data-lenis-prevent` (the Sheet primitive does).
- `not-found.tsx` (404 with category shortcuts), `error.tsx` (calls `retry`, stable since Next 16.3) and `global-error.tsx` (own `<html>`, imports `globals.css` and the fonts).
- `SiteHeader` reads the router (`usePathname` for `aria-current`, `useRouter` for search). Its search is a native GET form to `/buscar` (works before hydration) that navigates on the client once hydrated. Tests mock `next/navigation`; stories set `parameters.nextjs.appDirectory` and `navigation.pathname`.
- Async Server Component containers are tested with `render(await Container())`; a page that embeds one mocks the container module.
- The header search follows `?q=` on `/buscar` via `useSearchParams` inside a Suspense boundary whose fallback is the same empty native form (static pages stay prerendered). Tests that render `SiteHeader` mock `useSearchParams` too.
- Root metadata uses a title template (`%s · Migeanje Store`): pages return only their own title.

## Discovery pages

- Routes: `/` (home), `/categorias/[slug]` (dynamic: reads `searchParams`), `/marcas/[slug]` (SSG), `/buscar?q=` (dynamic, `noindex`). Static params and metadata live in `catalog/ui/catalog-routes.ts`; unknown slugs call `notFound()` in the container.
- URL boundary: `catalog/ui/catalog-url.ts` parses `searchParams` with Zod into a domain query and serializes it back canonically (`marca`, `disponibilidad=en-stock|en-importacion|agotado`, `potencia=60-140`, repeated option values, `pantalla=si`, `orden=relevancia|precio-asc|precio-desc`, `pagina`). Spec keys map to Spanish param names in `SPEC_PARAM_NAMES` (documented table there); `specParams` throws on a clash. Junk params are dropped, never thrown; the domain `sanitizeFilters` (with facets) is the last word.
- Filters and sort are native GET forms (work without JavaScript; the no-JS range fields are `potencia-desde`/`potencia-hasta`), enhanced in `catalog/ui/category-controls.tsx` to `router.push` the canonical URL with `{ scroll: false }`. Key the uncontrolled forms by the canonical URL so they follow it after a chip is removed.
- No-JS fallbacks use Tailwind's `noscript:` variant (`@media (scripting: none)`): the phone "Filtros" button becomes a link to `#filtros`, and the inline panel shows via `target:flex`.
- Result counts render in `role="status"` so client-side filter changes are announced. With no section heading between the h1 and the grid, product names are h2.
- A Server Component cannot read a non-component export of a `"use client"` module (it gets a client reference, not the value): e.g. `chipClassName` is only used from client components (`ActiveFilters`).
- Motion: `ScrollReveal` (organism) reveals sections once on scroll under `gsap.matchMedia("(prefers-reduced-motion: no-preference)")` and never hides a section already in view; the home hero glow "warms up" with CSS `starting:` only.

## Product page and comparator

- `/productos/[slug]` (`catalog/ui/product-page.container.tsx`): `generateStaticParams` lists the 19 products, but the page reads `?variante=<sku>` (lowercase SKU, parsed case-insensitively in `catalog-url.ts`), so it renders per request like the category page. The default variant (`defaultVariant`: best availability, then lowest price) has no param; the canonical URL is the bare product path.
- Variant options are hierarchical (`domain/variant-selection.ts`): a value of option N is offered only with the selected values of options 0..N-1, so the first option is never blocked; a choice leads to the closest variant. Blocked values are not links and say why ("No disponible con chip ...", "Agotado"). The selector is plain links (`replace`, `scroll={false}`, `prefetch={false}`): shareable and works without JavaScript.
- Swatches: `VariantSelector` accepts an optional CSS color per value, but product data has none yet (no color literals in code); color options render as text-labelled segmented options.
- Buy box: in stock up to 5 units, backorder up to 2 (`MAX_QUANTITY`), with the backorder explainer (DRAFT copy in `catalog-copy.ts`); unavailable products get the client-only "Avísame cuando llegue" mock (Zod email check, nothing sent).
- Cart extension point: `catalog/ui/add-to-cart.ts` defines `AddToCartAction` (`(previous, formData) => Promise<{ ok, message }>`, for `useActionState`) and the form fields (`sku`, `cantidad`, parsed by `parseAddToCartForm`). The product route passes the cart's `addToCartAction` as `<ProductPageContainer addToCart={...} />`; the form posts to it, so it also works without JavaScript. After a successful add, `PurchaseForm` calls the listener of `AddToCartFeedbackProvider` (`catalog/ui/add-to-cart-feedback.tsx`) once per answer: the cart provides it and opens the drawer. The catalog never imports the cart.
- JSON-LD: `serializeJsonLd` (`shared/lib/json-ld.ts`) escapes `<`, `>`, `&`, U+2028/9 for `dangerouslySetInnerHTML`; prices as decimals via `toDecimalAmount` (`shared/lib/money.ts`). URLs are relative until a site URL exists.
- Compare tray (`catalog/ui/compare-tray*.ts(x)`): per browser in `localStorage` (`migeanje:comparar`), every access wrapped in try/catch with an in-memory fallback; max 4 products of one category; adding another category asks inline to start over. `CompareToggle` is only on the product page (a button inside `ProductCard` would break the stretched link). `CompareTrayBar` (discovery layout) sticks to the bottom of `<main>` and hides on `/comparar`, whose `CompareTraySync` makes the tray follow the URL.
- `/comparar?productos=a,b&diferencias=si` (`compare-page.container.tsx`, `noindex`): every `ProductComparisonError` reason is a friendly `EmptyState` with next steps (`compare-page.view.ts`). The table scrolls inside its own focusable region (`data-lenis-prevent-horizontal`) with a sticky label column; the page never scrolls sideways at 375px.
- `next/image` with the SVG placeholders needs no config: Next sets `unoptimized` automatically when `src` ends in `.svg` (default loader). Never enable `dangerouslyAllowSVG`.

## Cart

- `src/modules/cart`: `domain/cart.ts` (Zod `cartSchema` = the persisted shape; pure `addLine`, `setLineQuantity`, `deleteLine`, `clearLines`), `domain/cart-summary.ts` (`summarizeCart`: item count, subtotal in céntimos, `hasBackorder`, latest lead time, `shippingNote` key), `application/ports.ts` (`CartRepository`, `ProductLookup`) + one use case per file, `infrastructure/` (adapters, cookie, composition root), `ui/`.
- One line per SKU with a snapshot (unit price, availability, name, image, href) refreshed from `ProductLookup` on every add and quantity change; the client never sends prices. Limits per line: 5 in stock, 2 on backorder (`MAX_LINE_QUANTITY`), lower when the lookup knows a smaller `stockLimit`; unavailable SKUs are refused. Adding above the limit clamps and returns the reason (`in_stock_limit`, `backorder_limit`, `stock_limit`); a line already at the limit answers `limit_reached`.
- The cart never imports catalog internals except in `infrastructure/catalog-product-lookup.ts` (the anti-corruption layer: catalog port and types, `productHref`). The cart's composition root (`getCartServices()`, `server-only`) reads `DATA_SOURCE` with `readDataSource` (`shared/lib/data-source.ts`); `mock` is an in-memory store on `globalThis`, DEV ONLY: lost on restart, not shared between instances.
- Cookie `mg_cart` = cart id (UUID): httpOnly, SameSite=Lax, Secure in production, path `/`, 30 days, renewed on every change (`infrastructure/cart-cookie.ts`). Only server actions write it.
- Server actions (`ui/actions.ts`): `addToCartAction`, `updateQuantityAction`, `removeLineAction`, all `(previous, formData) => { ok, message }` (fields `sku`, `cantidad`). They call `refresh()` from `next/cache` so the same response re-renders the header count, the drawer and `/carrito`. Customer messages live in `ui/cart-copy.ts` (DRAFT).
- The root layout wraps the page in `CartRoot` (reads the cookie, so every route renders per request) and passes `<CartHeaderButton />` to `SiteHeaderContainer`'s `cart` slot. `CartProvider` (client) holds `useOptimistic` lines (failed actions roll back by themselves and announce an error), the drawer state (closes on navigation) and the add-to-cart listener. `useCart()` throws outside it.
- Header control (`CartButton` molecule): a link to `/carrito` in the server HTML, a button with `aria-haspopup="dialog"` once hydrated (`useHydrated` from `shared/lib`). Tests that look for it by `aria-haspopup` also match the mobile menu trigger; query by name.
- Drawer (`CartDrawer` organism): after an add it opens with focus on the polite status ("Agregaste … al carrito"); before a line is removed focus moves to that status. Following a link inside closes it. The whole panel scrolls; the footer sticks only on tall screens.
- `/carrito` (`CartPageContainer`) shows the same content; before hydration its controls are forms posting to the server actions (`CartLineForms`, `useActionState`), so the cart works without JavaScript.
- Reading the cart from a Server Component (checkout): `loadCart()` from `ui/cart-data.ts` (`server-only`, React `cache` per request) returns `Cart | null`; totals with `summarizeCart(cart.lines)`.

## Checkout and orders

- Dependencies point one way: `cart` ← `checkout` ← `orders`. The checkout never imports orders; the `/checkout/pago` route passes the orders module's `placeOrderAction` as `<PaymentStepContainer pay={...} />` (`checkout/ui/pay-action.ts` defines `PayAction`).
- `src/modules/checkout`: `domain/` (customer: DNI 8 digits, CE 9–12 alphanumerics, mobile `9` + 8 digits, RUC with SUNAT's check digit; `receipt`; `ubigeo` tree + `resolveUbigeo`; `shipping` zones and rates; `delivery` business days in Lima; `payment-card` Luhn/expiry; `checkout-draft` + `pendingStep`; `checkout-totals`, the one pricing rule for summary and order), `application/` (ports `CheckoutDraftRepository`, `UbigeoDirectory`; `saveContact`, `saveReceipt`...), `infrastructure/` (in-memory drafts on `globalThis`, mock ubigeo `fixtures/ubigeo.ts`: all 25 departamentos, a SUBSET of provincias/distritos), `ui/`.
- Shipping and ubigeo live in checkout (they are collected and priced there; orders snapshot them). Rates (DRAFT): Lima Metropolitana (provincia `1501`) S/ 10.00, 24–48 h; Callao (departamento `07`) S/ 12.00, 24–48 h; rest of Peru S/ 20.00, 3–5 business days. A backorder adds its lead time to the estimate, not to the cost.
- Steps are pages (`/checkout/contacto`, `/comprobante`, `/pago`; `/checkout` redirects to `pendingStep`). The draft is kept per cart id (the `mg_cart` cookie). Server actions validate every step with the same Zod schemas as the client (`ui/checkout-forms.ts`, Spanish messages) and redirect to the next step; an empty cart goes to `/carrito`.
- Client forms: React Hook Form + `zodResolver` through `useCheckoutForm` (inline errors on blur, all on submit), then `startTransition(() => formAction(new FormData(form)))`. The same forms post natively without JavaScript; the server answers `{ values, errors, formError, attempt }` and `ErrorSummary` gets focus after a failed submit. Pass `defaultValue` from `state.values` to registered inputs so server-rendered pages keep what was typed. Keep `errors` memoized: React Hook Form re-applies it whenever the object changes.
- No-JS ubigeo: the selects cannot filter, so a `noscript:` "Actualizar provincias y distritos" submit (`intent=ubigeo`) re-renders the options. It comes after "Continuar" in the DOM so Enter continues.
- Facturas: `features.factura` in `src/shared/config/features.ts` (OFF under Nuevo RUS). The receipt step, its server action and `placeOrder` all read it; a saved factura counts as missing while it is off.
- `src/modules/orders`: `domain/order.ts` (`MG-<year>-<6 random digits>`, lines snapshot, totals in céntimos, `shipping`, `estimatedDelivery`, `timeline` `pagado` → `en_importacion` (backorder only, reached at payment) → `preparando` → `en_camino` → `entregado`), `application/` (`OrderRepository` with `reserveNumber`, `PaymentGateway`, `ReconciliationLog`; `placeOrder` re-prices every line through the cart's `ProductLookup` and refuses to charge when a price, availability or limit changed, saving the refreshed cart; `findOrder(orders, number, email)`, `findOrderWithAccessToken`), `infrastructure/` (in-memory orders and reconciliation log, demo gateway: `4111 1111 1111 1111` approves, `4000 0000 0000 0002` declines, anything else is `not_a_test_card`).
- Payment guard (`placeOrder`): the payment page posts the `PaymentQuote` it shows (`checkout/domain/payment-quote.ts`: total in céntimos + an FNV-1a fingerprint of SKU × quantity × unit price × availability + shipping zone/cost) in hidden fields `expectedTotal`/`quoteFingerprint` (`readPaymentQuote`, works without JavaScript). The server recomputes it and answers `cart_changed` with a `quote` change (nothing charged, message with the new total, `refresh()` re-renders "Pagar S/ X") when it differs or is missing. It only compares: it always charges its own total.
- Order of `placeOrder` after the checks: reserve the number (never handed out twice, even before saving) → `prepareOrder` builds and validates the whole order → charge → `payOrder` + save. Anything thrown before the charge means nothing was charged ("inténtalo de nuevo" is safe). After an approved charge nothing throws: a failed save answers `order_persist_failed_after_charge` ("Registramos tu pago… No vuelvas a pagar", with the number as reference), records a `PendingReconciliation` (in memory, DEV ONLY) and logs one JSON event without card or personal data; a failed cart clear keeps the order (`cartCleared: false`, event `order_cart_not_cleared`). Real idempotency (Culqi idempotency key / order intent) and an ambiguous gateway error (timeout: charged or not) belong to F4.
- Card data goes from the form to the gateway only: never stored in the order or draft, never logged, never echoed in the form state.
- Confirmation `/checkout/confirmacion/[number]`: the paying browser gets `mg_order` (`<number>.<accessToken>`, httpOnly, one hour); anyone else unlocks it with the buyer's email (`unlockOrderAction`).
- Timeline rules live in `orderSchema`: every status in `ORDER_STATUSES` order (`en_importacion` exactly when a line is on backorder), reached statuses first (at least `pagado`), dates never going back. `advanceOrder(order, at)` reaches the next status (throws when delivered or for an earlier time). `normalizeOrderNumber` also accepts spaces or missing dashes (`mg 2026 004521`, `MG2026004521`).

## Order tracking

- `/pedidos/seguimiento` (`orders/ui/order-tracking.container.tsx`, `noindex`): order number + email in a POST server action (`trackOrderAction`), so the email never reaches a URL or access log; same Zod schema on the client (`ui/tracking-form.ts`, reusing checkout's `useCheckoutForm`), works without JavaScript. `?numero=` (`orderTrackingHref`, the confirmation's "Seguir mi pedido") prefills only a well-formed number.
- Unknown number and wrong email get the same neutral message. `trackOrder` (application) counts failed lookups per client in an `AttemptLimiter` (`shared/lib/attempt-limiter.ts`; 10 failures per 15 minutes per `x-forwarded-for`/`x-real-ip`, `getTrackingAttempts()` on `globalThis`); a blocked client is refused before the lookup. In-memory and spoofable without a trusted proxy: real rate limiting belongs to the edge or the backend.
- A successful lookup writes `mg_order` and redirects to `?numero=<number>`; the page shows the order of that cookie (refresh keeps it for the hour; the paying browser sees its order directly). "Consultar otro pedido" (`trackAnotherOrderAction`) clears the cookie, so the confirmation then asks for the email again.
- The public view (`ui/order-tracking-view.ts`) hides personal data: first name + initial, the first characters of the street (no reference), distrito/provincia/departamento, receipt type only (no DNI/RUC), email as `a•••@dominio`. Number + email still unlock the full confirmation (M6).
- Shared UI: organism `OrderStatusTimeline` (LEDs: done filled amber, current glowing + "Estado actual" + `aria-current="step"`, pending `led-off` ring; throws a RangeError unless done → one current → pending) and template `OrderTracking` (lookup slot or order view, help links). Dates are es-PE in Lima ("2 oct. 2026, 10:00 a. m.").
- Demo orders (`DATA_SOURCE=mock` only, seeded by the composition root from `infrastructure/fixtures/demo-orders.ts`, dated relative to server start; the page shows a "Datos de demostración" hint): email `demo@migeanje.pe` with `MG-2026-480315` (en importación, Arequipa), `MG-2026-275904` (en camino, Lima), `MG-2026-913628` (entregado, Callao). A test keeps their lines equal to the catalog offers.

## Libro de Reclamaciones

- Legal basis (checked 2026-10-03, Engram `legal/libro-de-reclamaciones`; every legal text is DRAFT pending a lawyer): Ley 29571 arts. 24.1 (Ley 31435: answer within 15 business days, NOT extendable), 150–151 (Ley 32495: e-commerce book + permanent visible link, the footer's "Libro de Reclamaciones" on every page); Reglamento D.S. 011-2011-PCM as amended (art. 4-B: printable sheet + automatic email copy with filing date and time; Anexo I of D.S. 101-2022-PCM: fields, reclamo/queja definitions and the two notes, quoted verbatim in `complaints/ui/complaint-copy.ts`).
- `src/modules/complaints`: `domain/complaint.ts` (Zod `complaintSheetSchema`: number `000000001-2026` = Anexo I's 9-digit correlative per year in Lima + year; `responseDueDate` = 15 business days after the Lima date, holidays not modeled; provider snapshot; consumer with DNI/CE, address + ubigeo, optional phone, guardian for a minor; good `producto|servicio`, optional order number (orders format), amount in céntimos and description; `reclamo|queja`, detail, optional pedido; `responseChannel` `email|carta`; `declarationAccepted: true`; `copySentAt`), `application/` (`ComplaintRepository.file` numbers and stores in one step, so a failure leaves no gap; `ComplaintNotifier`; `fileComplaint`; `findComplaintWithAccessToken`), `infrastructure/` (in-memory book and mock notifier on `globalThis`, DEV ONLY: the mock outbox logs `complaint_copy_sent` with number, kind and email domain only), `ui/`.
- Required from the consumer: only what makes a claim "filed" (name, document, address, email, detail) plus the reclamo/queja choice and the declaration; the rest of the Hoja is optional so the book never refuses a claim the law accepts.
- The provider's identity comes from `src/shared/config/business.ts` (`null` = "Por definir"; fill `legalName`, `ruc`, `address` before launch: a virtual provider needs a RUC).
- `/libro-de-reclamaciones` (`ComplaintBookContainer`): same form pattern as checkout (`useCheckoutForm`, server action `fileComplaintAction`, no-JS ubigeo refresh, guardian fields revealed with `group-has-[#hoja-isMinor:checked]:flex`). `?pedido=` prefills only a well-formed order number; the tracking page passes it (`trackingHelpLinks(order.number)`).
- After filing: cookie `mg_complaint` (`<number>.<accessToken>`, httpOnly, one hour) and redirect to `/libro-de-reclamaciones/constancia/[number]` (`noindex`). Anyone else gets the same neutral "No podemos mostrar esta constancia". A failed copy keeps the sheet filed, logs `complaint_copy_failed` (number + error only) and the constancia says so.

## Design tokens

- All tokens live in `src/shared/ui/tokens/tokens.css` (imported by `src/app/globals.css`).
- Colors use shadcn/ui variable names (`--background`, `--card`, `--primary`, `--muted-foreground`...) in `:root`, mapped to Tailwind utilities in `@theme inline` (`bg-card`, `text-muted-foreground`). Extras: `surface-raised`, `led-off`, `glow`.
- Brand accent = `primary` (`#FCBA03`, the only UI accent). shadcn's `accent` is a subtle hover surface, not the brand.
- Tailwind's default palette and radii are reset: only our tokens exist (`rounded-sm|md|lg|pill|full`, `text-display-xl|display-l|title|body|body-sm|caption`). Spacing keeps Tailwind's 4px scale. Motion: `duration-(--duration-fast|base|slow|story)`, `ease-out`, `ease-in-out`.
- `rounded-full` is 50% (circles for square elements like the LED dot and avatars); use `rounded-pill` for buttons and any non-square pill shape.
- Dark-only MVP. A light theme only redefines the `:root` values; components never change.
- Print theme: `@media print` in `tokens.css` redefines `:root` to ink on paper (`--paper`, `--ink`, `--ink-muted`; pairs in `PRINT_PAIRS`). Header and footer are `print:hidden`; hide on-screen actions with `print:hidden` too.
- No raw hex (or other color literals) in components. No green in UI tokens; no amber/yellow warnings.
- `tokens.test.ts` enforces WCAG 2.2 AA contrast for every allowed pair, the no-green rule and the shadcn mapping. It must stay green.
- The allowed pairs and thresholds live in `src/shared/ui/tokens/contrast-pairs.ts`, shared by `tokens.test.ts` and the Colors docs: add new pairs there when you add tokens. If a shadcn alias gets its own value, remove it from `ALIAS_SOURCES` there.
- Never use `--led-off` as text on `--surface-raised` (3.97:1, below 4.5:1); use `--muted-foreground` for secondary text.

## Components

- Atoms are our own components: `src/shared/ui/atoms/<name>/` holds `<name>.tsx`, `<name>.test.tsx`, `<name>.stories.tsx` and `index.ts`. Story titles: `Atoms/<Name>` (then `Molecules/`, `Organisms/`).
- shadcn/ui only for Radix-backed primitives where behavior and a11y matter (dialog/sheet, select, checkbox, radio group, tooltip, accordion, tabs...), never for trivial atoms. `components.json` sends them to `src/shared/ui/primitives` (style `radix-nova`, `radix-ui` package); restyle them with our tokens. Never run a shadcn command that rewrites `globals.css` or `tokens.css` (`init`, theme or preset changes).
- Primitives are flat files as shadcn writes them (`primitives/sheet.tsx`, plus `sheet.test.tsx` and a `Primitives/Sheet` story). There is no `tw-animate-css`: enter transitions use Tailwind's `starting:` variant (`@starting-style`); exits are instant.
- Organisms (`src/shared/ui/organisms/<name>/`, same four files) take presentational props and never import modules; module containers feed them.
- Merge classes with `cn()` from `@/shared/lib/cn`. When you add a custom utility to `tokens.css` (`--text-*`, `--radius-*`, `--shadow-*`...), register it in `cn.ts` too, or tailwind-merge puts it in the wrong group (e.g. `text-display-xl` read as a color drops `text-foreground`).
- Icons from `lucide-react` are decorative (`aria-hidden`); the text carries the meaning.
- Every component needs behavior tests (Testing Library roles and names), an axe check with `expectNoAxeViolations` from `@/test/a11y` for every variant and state, and a story. jsdom cannot compute contrast, so axe's `color-contrast` rule is off there; `tokens.test.ts` and the Storybook a11y addon cover it.
- Spread `{...props}` first and computed attributes after it: TypeScript accepts any `aria-*`/`data-*` JSX attribute, so omitting one from the props type does not stop a caller from overriding state such as `aria-busy`.
- Atoms with state or event handlers that own state (e.g. `Chip`) start with `"use client"`; Storybook's Vite build warns that it ignores the directive, which is expected.
- Molecules (`src/shared/ui/molecules/<name>/`, same four files) compose atoms; never re-implement an atom's styles.
- Stateful components support controlled (`value` + `onValueChange`) and uncontrolled (`defaultValue`, read once on mount) modes. Props outside their documented domain (bounds, a controlled `value`, a `defaultValue`) throw a `RangeError`; what the user types is input, so it is clamped, never thrown.
- Form fields: wrap controls in `FormField`. Its `children` is a render prop that receives the wired props (`id`, `aria-describedby`, `aria-invalid`, `required`/`aria-required`): `{(control) => <Input {...control} type="email" />}`; without children it renders an `Input`. Decide whether an optional slot (error, hint) exists with `isEmptyNode` from `@/shared/lib/react-node`, the same check `FieldError` uses.
- Long forms: `FormSection` (numbered region with an h2), `RadioCards` (radios as cards with a description each, ids `${idPrefix}-${value}`), `Textarea` (atom), `DescriptionList` for read-only labelled values, `PrintButton` (needs JavaScript; shows a hint without it).
- Icon-only buttons get their name from visually hidden text (`<span className="sr-only">Buscar</span>` plus a decorative `leadingIcon`), not `aria-label`.
- Clickable cards (`ProductCard`) use the stretched-link pattern: one link on the title with `after:absolute after:inset-0` inside a `relative` card, no other interactive elements, and the focus ring on the card via `has-focus-visible:`.
- Interaction tests: jsdom does not turn Enter/Space into a click. Use `@testing-library/user-event` (`userEvent.setup()`) for keyboard, typing and pointer flows; `fireEvent` only for single synthetic events.

## Money

- Amounts are integers in minor units (céntimos): S/ 129.90 is `12990`. Never do arithmetic on soles as floats.
- Format with `formatPEN` from `@/shared/lib/money` (es-PE, PEN): `12990` -> `"S/\u00A0129.90"` (no-break space; thousands with `,`, decimals with `.`). It throws a `RangeError` for fractions, negatives, NaN/Infinity and unsafe integers. Display prices with the `Price` atom.
- Testing Library's default normalizer turns the NBSP into a plain space: query with `getDefaultNormalizer({ collapseWhitespace: false })` and compare `textContent` to keep it exact.

## Storybook

- Foundations docs (Colors, Typography, Spacing, Radii, Motion) live in `src/shared/ui/foundations/` as `Foundations/*` stories. They read token values from the computed CSS variables; never hardcode values there.
- Every new UI component needs a story next to it (`*.stories.tsx`). The a11y addon must report no violations.
- Stories always render on our tokens: the backgrounds feature is disabled, and `preview.tsx` loads `globals.css` and the Geist variables like `src/app/layout.tsx`.
- Storybook aliases `geist/font/sans|mono` to `.storybook/geist-fonts.ts`: its `next/font` transform skips node_modules, so the `geist` package's own loaders do not bundle there.

## Language contract

- English: code, identifiers, comments, commit messages, technical docs.
- Neutral Peruvian Spanish with "tú" (never voseo): all customer-facing UI copy.
- `<html lang="es-PE">`.

## Git workflow

- `main` is always stable. Work on short feature branches and open a PR, even when working solo.
- Squash merge into `main`.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`...). No AI attribution or co-author trailers.
- Agents may create local branches and commits. Only the owner pushes, opens PRs and merges.
- Line endings are LF (`.gitattributes`); Biome fails on CRLF.

## Definition of Done

- [ ] Code + tests (test-first for money flows: prices, cart, checkout).
- [ ] CI green (lint, typecheck, test, build).
- [ ] Storybook story for every new UI component.
- [ ] Accessibility check (WCAG 2.2 AA).
- [ ] ADR in `docs/adr/` when a storefront decision was made.
