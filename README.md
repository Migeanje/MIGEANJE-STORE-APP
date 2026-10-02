# Migeanje Store — storefront

Web storefront for Migeanje Store, a premium tech accessories shop for Peru. Built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Requirements

- Node.js 24 (see `.nvmrc`)
- pnpm (version pinned in `package.json` → `packageManager`)

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` / `pnpm lint:fix` | Biome lint + format check / apply safe fixes |
| `pnpm format` | Format with Biome |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` / `pnpm test:watch` | Vitest |
| `pnpm storybook` | Storybook on http://localhost:6006 |
| `pnpm build-storybook` | Static Storybook build (`storybook-static/`) |

Design foundations (colors, typography, spacing, radii, motion) are documented in Storybook under `Foundations/*` (`src/shared/ui/foundations/`). Every new UI component needs a story.

Conventions for contributors (and coding agents) are in [`CLAUDE.md`](./CLAUDE.md).
