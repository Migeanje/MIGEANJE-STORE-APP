# ADR 0002 — UI component layering: own atoms, shadcn only for Radix primitives

- Status: Accepted
- Date: 2026-10-02
- Deciders: Claude (F1 implementation), within the stack approved by the owner
- Engram: `architecture/storefront-ui-components`

## Context

The planned stack uses Tailwind v4, shadcn/ui primitives (Radix) restyled with our tokens, Storybook and atomic design. shadcn's simple components (Button, Input, Label) are thin wrappers around `cva` and Radix Slot. Restyling them would mean maintaining their variants next to ours. Radix's real value is in complex interactive primitives where focus management and keyboard behavior are hard to get right (dialog/sheet, select, checkbox, radio group, tooltip, accordion, tabs).

## Decision

1. **Atoms and molecules are our own components** in `src/shared/ui/{atoms,molecules}/<name>/` with `<name>.tsx`, `<name>.test.tsx`, `<name>.stories.tsx` and `index.ts`. They use `cva`, the `radix-ui` Slot and `cn`.
2. **shadcn/ui is used only for Radix-backed primitives**, vendored into `src/shared/ui/primitives` (`components.json` `ui` alias), restyled with our tokens and consumed by molecules and organisms. shadcn commands must never rewrite `globals.css` or `tokens.css`.
3. **`cn()` = `clsx` + `tailwind-merge`** configured with `extendTailwindMerge`; every custom utility (type scale, `rounded-pill`, glow) must be registered there, otherwise tailwind-merge drops classes such as `text-foreground`.
4. **Accessibility is tested automatically.** Every component test asserts no axe violations (`src/test/a11y.ts`, axe-core in jsdom). The `color-contrast` rule is off in jsdom because contrast is enforced by `tokens.test.ts` and the shared `contrast-pairs.ts`.
5. **Shared UI stays free of domain imports.** Components take presentational props (for example `AvailabilityIndicator` takes a status and a caller-provided label); modules map their domain types to those props.

## Consequences

- Fewer vendored files to keep in sync with upstream shadcn; our variants live in one place.
- Complex primitives keep Radix's accessibility guarantees.
- Contributors must register new custom utilities in `cn.ts` and add stories plus axe-checked tests for every component (Definition of Done).
- Money is formatted from integer minor units (`formatPEN`); components never receive floats.
