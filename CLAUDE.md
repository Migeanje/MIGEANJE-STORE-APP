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

- Contexts: `catalog`, `cart`, `checkout`, `account`, `orders`, `editorial`, `procurement-status`.
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
- Cart extension point (M5): `catalog/ui/add-to-cart.ts` defines `AddToCartAction` (`(previous, formData) => Promise<{ ok, message }>`, for `useActionState`) and the form fields (`sku`, `cantidad`, parsed by `parseAddToCartForm`). The cart module exports a `"use server"` action of that type and the route passes it as `<ProductPageContainer addToCart={...} />`; the form posts to it, so it also works before hydration. Without it the button says the cart is not ready.
- JSON-LD: `serializeJsonLd` (`shared/lib/json-ld.ts`) escapes `<`, `>`, `&`, U+2028/9 for `dangerouslySetInnerHTML`; prices as decimals via `toDecimalAmount` (`shared/lib/money.ts`). URLs are relative until a site URL exists.
- Compare tray (`catalog/ui/compare-tray*.ts(x)`): per browser in `localStorage` (`migeanje:comparar`), every access wrapped in try/catch with an in-memory fallback; max 4 products of one category; adding another category asks inline to start over. `CompareToggle` is only on the product page (a button inside `ProductCard` would break the stretched link). `CompareTrayBar` (discovery layout) sticks to the bottom of `<main>` and hides on `/comparar`, whose `CompareTraySync` makes the tray follow the URL.
- `/comparar?productos=a,b&diferencias=si` (`compare-page.container.tsx`, `noindex`): every `ProductComparisonError` reason is a friendly `EmptyState` with next steps (`compare-page.view.ts`). The table scrolls inside its own focusable region (`data-lenis-prevent-horizontal`) with a sticky label column; the page never scrolls sideways at 375px.
- `next/image` with the SVG placeholders needs no config: Next sets `unoptimized` automatically when `src` ends in `.svg` (default loader). Never enable `dangerouslyAllowSVG`.

## Design tokens

- All tokens live in `src/shared/ui/tokens/tokens.css` (imported by `src/app/globals.css`).
- Colors use shadcn/ui variable names (`--background`, `--card`, `--primary`, `--muted-foreground`...) in `:root`, mapped to Tailwind utilities in `@theme inline` (`bg-card`, `text-muted-foreground`). Extras: `surface-raised`, `led-off`, `glow`.
- Brand accent = `primary` (`#FCBA03`, the only UI accent). shadcn's `accent` is a subtle hover surface, not the brand.
- Tailwind's default palette and radii are reset: only our tokens exist (`rounded-sm|md|lg|pill|full`, `text-display-xl|display-l|title|body|body-sm|caption`). Spacing keeps Tailwind's 4px scale. Motion: `duration-(--duration-fast|base|slow|story)`, `ease-out`, `ease-in-out`.
- `rounded-full` is 50% (circles for square elements like the LED dot and avatars); use `rounded-pill` for buttons and any non-square pill shape.
- Dark-only MVP. A light theme only redefines the `:root` values; components never change.
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
