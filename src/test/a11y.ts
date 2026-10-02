import axe, { type Result, type RunOptions } from "axe-core";

const RUN_OPTIONS: RunOptions = {
  rules: {
    // jsdom does not compute styles, so axe cannot measure contrast here.
    // Contrast is enforced for every allowed token pair by tokens.test.ts
    // (see src/shared/ui/tokens/contrast-pairs.ts) and by the Storybook a11y addon.
    "color-contrast": { enabled: false },
    // Components render in isolation, outside the page landmarks.
    region: { enabled: false },
  },
};

/** Runs axe-core on a rendered subtree and returns its violations. */
export async function runAxe(container: Element): Promise<Result[]> {
  const results = await axe.run(container, RUN_OPTIONS);
  return results.violations;
}

function formatViolation(violation: Result): string {
  const targets = violation.nodes
    .map((node) => `    ${node.target.join(" ")}`)
    .join("\n");
  return `  ${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}\n${targets}`;
}

/** Fails the test with a readable report when axe finds any violation. */
export async function expectNoAxeViolations(container: Element): Promise<void> {
  const violations = await runAxe(container);
  if (violations.length > 0) {
    throw new Error(
      `Expected no axe violations, found ${violations.length}:\n${violations
        .map(formatViolation)
        .join("\n")}`,
    );
  }
}
