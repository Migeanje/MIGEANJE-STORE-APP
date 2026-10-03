import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { CompareToggle } from "./compare-toggle";
import type { CompareItem } from "./compare-tray";
import { createCompareTrayStore } from "./compare-tray-store";

const CHARGERS = { slug: "cargadores", name: "Cargadores" };
const POWER_BANKS = { slug: "power-banks", name: "Power banks" };

function item(slug: string, category = CHARGERS): CompareItem {
  return { slug, name: `Producto ${slug}`, category };
}

function storeWith(...items: CompareItem[]) {
  const store = createCompareTrayStore(() => null);
  for (const entry of items) store.add(entry);
  return store;
}

describe("CompareToggle", () => {
  it("adds the product to the tray and announces it", async () => {
    const user = userEvent.setup();
    const store = storeWith(item("a"));
    render(<CompareToggle item={item("b")} store={store} />);

    const toggle = screen.getByRole("button", { name: "Comparar" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(store.getSnapshot().items.map(({ slug }) => slug)).toEqual([
      "a",
      "b",
    ]);
    expect(
      screen.getByText("Agregaste Producto b a la comparación (2 de 4)."),
    ).toBeInTheDocument();
  });

  it("is pressed for a product already in the tray, and takes it out", async () => {
    const user = userEvent.setup();
    const store = storeWith(item("a"), item("b"));
    render(<CompareToggle item={item("b")} store={store} />);

    await user.click(screen.getByRole("button", { name: "Comparar" }));

    expect(store.getSnapshot().items.map(({ slug }) => slug)).toEqual(["a"]);
    expect(
      screen.getByText("Quitaste Producto b de la comparación."),
    ).toBeInTheDocument();
  });

  it("says when the tray is full and links to the comparison", async () => {
    const user = userEvent.setup();
    const store = storeWith(item("a"), item("b"), item("c"), item("d"));
    render(<CompareToggle item={item("e")} store={store} />);

    await user.click(screen.getByRole("button", { name: "Comparar" }));

    expect(screen.getByText(/Ya tienes 4 productos/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver la comparación" }),
    ).toHaveAttribute("href", "/comparar?productos=a,b,c,d");
    expect(store.getSnapshot().items).toHaveLength(4);
  });

  it("asks inline before replacing a tray of another category", async () => {
    const user = userEvent.setup();
    const store = storeWith(item("a"), item("b"));
    render(<CompareToggle item={item("bank", POWER_BANKS)} store={store} />);

    await user.click(screen.getByRole("button", { name: "Comparar" }));

    expect(
      screen.getByText(/Tu comparación tiene cargadores/),
    ).toBeInTheDocument();
    expect(store.getSnapshot().items).toHaveLength(2);

    await user.click(
      screen.getByRole("button", { name: "Empezar nueva comparación" }),
    );

    expect(store.getSnapshot().items).toEqual([item("bank", POWER_BANKS)]);
    expect(screen.getByRole("button", { name: "Comparar" })).toHaveFocus();
    expect(
      screen.getByText("Empezaste una nueva comparación con Producto bank."),
    ).toBeInTheDocument();
  });

  it("keeps the tray when the replacement is cancelled", async () => {
    const user = userEvent.setup();
    const store = storeWith(item("a"));
    render(<CompareToggle item={item("bank", POWER_BANKS)} store={store} />);

    await user.click(screen.getByRole("button", { name: "Comparar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(store.getSnapshot().items).toEqual([item("a")]);
    expect(screen.queryByText(/Tu comparación tiene/)).toBeNull();
    expect(screen.getByRole("button", { name: "Comparar" })).toHaveFocus();
  });

  it("announces changes politely", () => {
    const { container } = render(
      <CompareToggle item={item("a")} store={storeWith()} />,
    );

    expect(container.querySelector("[aria-live=polite]")).not.toBeNull();
  });

  it("has no axe violations, also while asking", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CompareToggle
        item={item("bank", POWER_BANKS)}
        store={storeWith(item("a"))}
      />,
    );
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole("button", { name: "Comparar" }));

    await expectNoAxeViolations(container);
  });
});
