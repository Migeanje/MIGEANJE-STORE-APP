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

CI (`.github/workflows/ci.yml`) runs install (frozen lockfile), lint, typecheck, test and build on every PR and on push to `main`.

## Stack

- Next.js (App Router) + React, TypeScript strict, `src/` directory, alias `@/*` -> `src/*`.
- Tailwind CSS v4 (CSS-first config, `@theme` tokens).
- pnpm (version pinned in `packageManager`); Node from `.nvmrc`.
- Biome for lint and format. No ESLint, no Prettier.
- Vitest + Testing Library (jsdom). Tests live next to the code as `*.test.ts(x)`.
- Fonts: Geist Sans + Geist Mono via `next/font/google` (`src/shared/ui/tokens/fonts.ts`).
- Planned in later tasks: Storybook, shadcn primitives (restyled), GSAP/Lenis.

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

## Design tokens

- All tokens live in `src/shared/ui/tokens/tokens.css` (imported by `src/app/globals.css`).
- Colors use shadcn/ui variable names (`--background`, `--card`, `--primary`, `--muted-foreground`...) in `:root`, mapped to Tailwind utilities in `@theme inline` (`bg-card`, `text-muted-foreground`). Extras: `surface-raised`, `led-off`, `glow`.
- Brand accent = `primary` (`#FCBA03`, the only UI accent). shadcn's `accent` is a subtle hover surface, not the brand.
- Tailwind's default palette and radii are reset: only our tokens exist (`rounded-sm|md|lg|pill|full`, `text-display-xl|display-l|title|body|body-sm|caption`). Spacing keeps Tailwind's 4px scale. Motion: `duration-(--duration-fast|base|slow|story)`, `ease-out`, `ease-in-out`.
- Dark-only MVP. A light theme only redefines the `:root` values; components never change.
- No raw hex (or other color literals) in components. No green in UI tokens; no amber/yellow warnings.
- `tokens.test.ts` enforces WCAG 2.2 AA contrast for every allowed pair, the no-green rule and the shadcn mapping. It must stay green; add new pairs there when you add tokens.
- Never use `--led-off` as text on `--surface-raised` (3.97:1, below 4.5:1); use `--muted-foreground` for secondary text.

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
