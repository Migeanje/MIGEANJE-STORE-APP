// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { findProductCards } from "./product-cards";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("findProductCards", () => {
  it("answers listing cards in the requested order, skipping unknown slugs", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");

    const cards = await findProductCards([
      "soundcore-liberty-5",
      "no-existe",
      "anker-prime-charger-100w-3-puertos",
    ]);

    expect(cards.map(({ slug }) => slug)).toEqual([
      "soundcore-liberty-5",
      "anker-prime-charger-100w-3-puertos",
    ]);
    const [first] = cards;
    expect(first?.card).toMatchObject({
      href: "/productos/soundcore-liberty-5",
      brand: "Soundcore",
    });
    expect(first?.card.specs?.length).toBeGreaterThan(0);
  });

  it("answers nothing for no slugs", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    expect(await findProductCards([])).toEqual([]);
  });
});
