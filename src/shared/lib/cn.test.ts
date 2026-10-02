import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins conditional class values like clsx", () => {
    const hidden = false;
    expect(
      cn("px-4", hidden && "hidden", undefined, ["py-2", { flex: true }]),
    ).toBe("px-4 py-2 flex");
  });

  it("keeps the last of two conflicting Tailwind classes", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
    expect(cn("bg-primary", "bg-surface-raised")).toBe("bg-surface-raised");
  });

  it("treats our type scale as font sizes, not text colors", () => {
    expect(cn("text-display-xl", "text-foreground")).toBe(
      "text-display-xl text-foreground",
    );
    expect(cn("text-foreground", "text-body-sm")).toBe(
      "text-foreground text-body-sm",
    );
  });

  it("merges two sizes from our type scale", () => {
    expect(cn("text-body", "text-caption")).toBe("text-caption");
    expect(cn("text-title", "text-display-l")).toBe("text-display-l");
  });

  it("merges our radii, including rounded-pill", () => {
    expect(cn("rounded-md", "rounded-pill")).toBe("rounded-pill");
    expect(cn("rounded-pill", "rounded-full")).toBe("rounded-full");
  });

  it("treats shadow-glow as a shadow, not a shadow color", () => {
    expect(cn("shadow-glow", "shadow-none")).toBe("shadow-none");
    expect(cn("hover:shadow-glow", "shadow-none")).toBe(
      "hover:shadow-glow shadow-none",
    );
  });
});
