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
- Planned in later tasks: Storybook, shadcn primitives (restyled), GSAP/Lenis, fonts and design tokens.

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
