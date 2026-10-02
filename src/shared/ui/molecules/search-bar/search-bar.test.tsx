import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { SearchBar } from "./search-bar";

function getSearchbox() {
  return screen.getByRole("searchbox", { name: "Buscar productos" });
}

describe("SearchBar", () => {
  it("renders a search landmark with a visually hidden label", () => {
    render(<SearchBar onSearch={() => {}} />);

    const form = screen.getByRole("search");
    expect(form.tagName).toBe("FORM");
    const input = getSearchbox();
    expect(form).toContainElement(input);
    expect(input).toHaveAttribute("type", "search");
    expect(input).toHaveAttribute(
      "placeholder",
      "Busca cargadores, cables, power banks…",
    );
    expect(screen.getByText("Buscar productos")).toHaveClass("sr-only");
  });

  it("has a submit button named by text, with a decorative icon", () => {
    render(<SearchBar onSearch={() => {}} />);

    const submit = screen.getByRole("button", { name: "Buscar" });
    expect(submit).toHaveAttribute("type", "submit");
    expect(
      submit.querySelector("svg")?.closest('[aria-hidden="true"]'),
    ).not.toBe(null);
  });

  it("calls onSearch with the trimmed query on submit", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(getSearchbox(), "  cargador GaN 65 W  ");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("cargador GaN 65 W");
  });

  it("submits with Enter from the field", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(getSearchbox(), "power bank{Enter}");

    expect(onSearch).toHaveBeenCalledWith("power bank");
  });

  it.each([
    ["an empty query", ""],
    ["a query of only spaces", "   "],
  ])(
    "does not search for %s and keeps focus in the field",
    async (_label, typed) => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} />);

      if (typed) await user.type(getSearchbox(), typed);
      await user.click(screen.getByRole("button", { name: "Buscar" }));

      expect(onSearch).not.toHaveBeenCalled();
      expect(getSearchbox()).toHaveFocus();
    },
  );

  it("shows the clear button only when there is text", async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={() => {}} />);

    expect(
      screen.queryByRole("button", { name: "Borrar búsqueda" }),
    ).toBeNull();

    await user.type(getSearchbox(), "cable");

    expect(
      screen.getByRole("button", { name: "Borrar búsqueda" }),
    ).toHaveAttribute("type", "button");
  });

  it("clears the query and returns focus to the field", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} defaultValue="cable USB-C" />);
    const input = getSearchbox();
    expect(input).toHaveValue("cable USB-C");

    await user.click(screen.getByRole("button", { name: "Borrar búsqueda" }));

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: "Borrar búsqueda" }),
    ).toBeNull();
    // Clearing is not a search.
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("uses a 44px submit button and a clear button above the 24px minimum", async () => {
    render(<SearchBar onSearch={() => {}} defaultValue="cable" />);

    expect(screen.getByRole("button", { name: "Buscar" })).toHaveClass(
      "size-11",
    );
    expect(screen.getByRole("button", { name: "Borrar búsqueda" })).toHaveClass(
      "size-9",
    );
  });

  it("forwards native props to the form and merges className", () => {
    render(
      <SearchBar
        onSearch={() => {}}
        aria-label="Catálogo"
        className="max-w-xl"
      />,
    );

    const form = screen.getByRole("search", { name: "Catálogo" });
    expect(form).toHaveClass("max-w-xl", "flex");
  });

  it("has no axe violations (empty and with text)", async () => {
    const { container } = render(
      <div>
        <SearchBar onSearch={() => {}} aria-label="Catálogo" />
        <SearchBar
          onSearch={() => {}}
          aria-label="Marcas"
          defaultValue="Anker"
        />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
