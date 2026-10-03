import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import type { CompareItem } from "./compare-tray";
import { CompareTrayBar } from "./compare-tray-bar";
import { createCompareTrayStore } from "./compare-tray-store";

const navigation = vi.hoisted(() => ({ pathname: "/categorias/cargadores" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

const CHARGERS = { slug: "cargadores", name: "Cargadores" };

function item(slug: string): CompareItem {
  return { slug, name: `Producto ${slug}`, category: CHARGERS };
}

beforeEach(() => {
  navigation.pathname = "/categorias/cargadores";
});

describe("CompareTrayBar", () => {
  it("is hidden while the tray is empty and appears when a product is picked", () => {
    const store = createCompareTrayStore(() => null);
    render(<CompareTrayBar store={store} />);

    expect(screen.queryByRole("region", { name: "Comparación" })).toBeNull();

    act(() => {
      store.add(item("a"));
    });

    expect(
      screen.getByRole("region", { name: "Comparación" }),
    ).toHaveTextContent("1 de 4 para comparar · Cargadores");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("links to the comparator from two products", () => {
    const store = createCompareTrayStore(() => null);
    store.add(item("a"));
    store.add(item("b"));
    render(<CompareTrayBar store={store} />);

    expect(screen.getByRole("link", { name: "Comparar (2)" })).toHaveAttribute(
      "href",
      "/comparar?productos=a,b",
    );
  });

  it("empties the tray", async () => {
    const user = userEvent.setup();
    const store = createCompareTrayStore(() => null);
    store.add(item("a"));
    render(<CompareTrayBar store={store} />);

    await user.click(screen.getByRole("button", { name: "Vaciar" }));

    expect(store.getSnapshot().items).toEqual([]);
    expect(screen.queryByRole("region", { name: "Comparación" })).toBeNull();
  });

  it("stays out of the comparator itself", () => {
    navigation.pathname = "/comparar";
    const store = createCompareTrayStore(() => null);
    store.add(item("a"));
    render(<CompareTrayBar store={store} />);

    expect(screen.queryByRole("region", { name: "Comparación" })).toBeNull();
  });

  it("has no axe violations", async () => {
    const store = createCompareTrayStore(() => null);
    store.add(item("a"));
    store.add(item("b"));
    const { container } = render(<CompareTrayBar store={store} />);

    await expectNoAxeViolations(container);
  });
});
