# F1 — Design system (Migeanje Store storefront)

## Objective

Build the storefront design system for MIGEANJE-STORE-APP: project scaffold, design tokens, Storybook, and atomic components (atoms and molecules), ready for the functional mockups feature (`f1-mockups`, planned next).

## Problem / Why

The repository is empty. The F1 identity decisions are closed (Engram, project `migeanje-store`): visual concept (#37), typography (#38), accent color (#40), dark-only mode (#41), LED availability system (#42), radii (#43), motion (#44). They must become code before any page mockup can be built consistently.

## Scope

- In: scaffold (Next.js + TS + pnpm + Biome + Vitest), tokens (color, typography, spacing, radius, motion) in Tailwind v4, Storybook with token docs, atoms, molecules.
- Out: pages, fixtures, data modules, checkout flows (feature `f1-mockups`); backend; light mode values.

## Constraints

- Mobile-first; WCAG 2.2 AA; respect `prefers-reduced-motion`.
- Dark-only MVP with semantic tokens ready for a light theme (values only).
- One UI accent `#FCBA03`; no green and no amber warnings in UI tokens.
- UI copy in neutral Peruvian Spanish using "tú"; code, comments, identifiers in English.
- No brand logos as part of our identity; brand names descriptive only.
- Architecture per Engram #15 (3.5): `src/app` thin routes, `src/modules/<context>/{domain,application,infrastructure,ui}`, `src/shared/ui` with atomic design.
- Stack per Engram #30: pnpm, Biome, Node LTS `.nvmrc`, Tailwind v4 + shadcn primitives restyled, Storybook, Vitest + Testing Library.

## Tasks

| ID | Task | Route | Trigger evidence | Status |
|---|---|---|---|---|
| T1 | Scaffold: Next.js (latest stable, App Router, TS strict, `src/`), pnpm via corepack, Biome, `.nvmrc` (Node 24 LTS), Vitest + Testing Library, folder skeleton per #15, `.atl/` in `.gitignore`, repo `CLAUDE.md` with conventions (#21 10.4), GitHub Actions CI (lint, typecheck, test, build) | Delegated (writer) | Generator output + 2+ non-trivial config files | Done — `37f0d8b` |
| T2 | Tokens: Tailwind v4 `@theme` (semantic dark colors, Geist Sans/Mono via `next/font`, type scale, 4px spacing, radii, motion + reduced-motion base) + WCAG contrast tests on token pairs | Delegated (writer) | 2+ non-trivial files | Done — `b9f361e` |
| T2.1 | Token hardening from T2 review advisories: self-hosted `geist` fonts (R3-001), float-safe asserts (R3-002), 3-digit hex green guard (R3-003), radii test (R3-004) | Delegated (writer) | 3+ files incl. dependency change | In progress |
| T3 | Storybook (latest, Next.js framework) + a11y addon + token docs (Colors, Typography, Spacing, Radii, Motion) | Delegated (writer) | 2+ non-trivial files | Pending |
| T4 | Owner visual review of tokens in Storybook (neutral scale, type scale, spacing) | Inline | Decision only, no writes | Pending |
| T5 | Atoms: Button (pill, "encendido" glow), AvailabilityIndicator (LED), Heading/Text, Price (PEN), Input/Label/FieldError, Tag/Chip — tests + stories | Delegated (writer) | 2+ non-trivial files | Pending |
| T6 | Molecules: ProductCard, SpecList/SpecRow, FormField, QuantityStepper, SearchBar — tests + stories | Delegated (writer) | 2+ non-trivial files | Pending |
| T7 | ADR in `docs/adr/` for the visual identity decisions (#37–#44), per #21 10.3/10.6 | Inline | One passive document | Pending |

## Acceptance criteria

- `pnpm build`, `pnpm biome check`, `pnpm vitest run`, `pnpm build-storybook` pass.
- Every text/background token pair used by components meets WCAG AA (4.5:1 text, 3:1 non-text), enforced by tests.
- Storybook a11y addon reports no violations on token docs and components.
- With `prefers-reduced-motion: reduce`, no transform/scroll-linked motion; state changes stay instant.

## Checks

- Test-first applies to T2 (contrast tests RED before tokens) and T5/T6 (behavior tests RED before components).
- T1 has no meaningful RED: structural check (`pnpm build`, `pnpm biome check`).

## Delivery

- Forecast: ~2,200 authored changed lines (lockfiles and generated files excluded) → above the ~400 line budget.
- Strategy: `ask-on-risk`. Chain strategy derived from Engram #21 10.1 (main always stable, short feature branches, PR even when solo, squash merge): one short branch per slice, PR to `main`, next slice branches from updated `main`.
- Git base: `main` has no commits yet; base commit pending owner authorization. Push, PRs and merges stay with the owner.
- Task tracking in GitHub Issues/Projects (#21 10.5) is a remote operation: pending owner authorization; this document is the local source meanwhile.

## Progress

- 2026-10-02: Identity decisions closed (#37, #38, #40, #41, #42, #43, #44). Feature document created.
- 2026-10-02: Git base resolved: empty commit `e1742a6` on `main` (owner-authorized); branch `feat/f1-scaffold`. pnpm 12.8.1 installed via npm (corepack needed admin).
- 2026-10-02: T1 done — commit `37f0d8b` (19 files, ~396 authored lines + lockfile). Versions: next 16.3.8, react 19.3.0, tailwindcss 4.3.3, @biomejs/biome 2.5.15, typescript 7.0.2, vitest 5.0.3, pnpm 12.8.1; CI uses `pnpm/setup@v3` (action-setup only supports pnpm ≤10). Parent added `.gitattributes` (LF; Biome fails on CRLF with `core.autocrlf=true`).
  - Writer verification: `pnpm install --frozen-lockfile` ok; `pnpm lint` ok; `pnpm typecheck` ok (`next typegen && tsc --noEmit`); `pnpm test` 1/1 passed; `pnpm build` ok.
  - Parent spot check: `pnpm lint` ok (11 files); `pnpm test` 1/1 passed.
  - Risk tier: high (`shell_source` on `.github/workflows/ci.yml`); review due. Owner granted consent; 4-lens native review (lineage `review-159aa088e42ec39f`) approved with no blocker/critical findings; acknowledged, authority burned. Reviewed boundary: `3a6659b`.
  - Follow-ups: `.env.example` needs a `!.env.example` gitignore exception when added; actions use major tags (pin to SHAs later).

- 2026-10-02: T2 done — commit `b9f361e` on branch `feat/f1-tokens` (branched from `feat/f1-scaffold`; rebase onto `main` after the owner squash-merges T1). ~554 authored lines (≈290 tests; over the 400 advisory heuristic, not trimmed).
  - Tokens: shadcn naming, brand amber = `primary`; background `#0f0e0c`, card `#1c1a17`, surface-raised `#2a2723`, foreground `#f2eee6`, muted-foreground `#a39c91` (≥5.46:1 on all surfaces), input `#7d776d` (≥3.35:1), border `#3a3631` (decorative), led-off `#8a8379`, destructive `#ff7a6b`, glow = `color-mix(primary 45%)`. Tailwind default palette and radii reset.
  - RED: missing `./contrast` import, then missing `tokens.css` (ENOENT). GREEN: 3 files, 120 tests. Writer mutation check: 6 expected failures.
  - Writer verification: lint, typecheck, test (120), build all ok. Parent spot check: `pnpm test` 120 passed; `pnpm lint` ok.
  - Risk tier: medium (`executable_change` CLAUDE.md), review due (`slice_budget_reached`). Owner granted; 1-lens native review (reliability, lineage `review-ae92b31e8c88a240`) approved; acknowledged, authority burned. Reviewed boundary: `b9f361e`. Advisories R3-001..R3-004 → T2.1.

## Next step

Finish T2.1 (token hardening), then T3 (Storybook). Next review base: `b9f361e`.
