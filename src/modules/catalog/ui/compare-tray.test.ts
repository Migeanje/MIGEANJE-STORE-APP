// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  addToTray,
  type CompareItem,
  type CompareTray,
  EMPTY_TRAY,
  parseTray,
  removeFromTray,
  replaceTray,
  serializeTray,
  trayCategory,
} from "./compare-tray";

const CHARGERS = { slug: "cargadores", name: "Cargadores" };
const CABLES = { slug: "cables", name: "Cables" };

function item(slug: string, category = CHARGERS): CompareItem {
  return { slug, name: `Producto ${slug}`, category };
}

function tray(...slugs: string[]): CompareTray {
  return { items: slugs.map((slug) => item(slug)) };
}

describe("addToTray", () => {
  it("adds a product to an empty tray", () => {
    expect(addToTray(EMPTY_TRAY, item("a"))).toEqual({
      status: "added",
      tray: tray("a"),
    });
  });

  it("appends products of the same category, in order", () => {
    expect(addToTray(tray("a"), item("b")).tray).toEqual(tray("a", "b"));
  });

  it("does nothing for a product already in the tray", () => {
    expect(addToTray(tray("a"), item("a"))).toEqual({
      status: "already_added",
      tray: tray("a"),
    });
  });

  it("refuses a fifth product", () => {
    const full = tray("a", "b", "c", "d");

    expect(addToTray(full, item("e"))).toEqual({ status: "full", tray: full });
  });

  it("refuses a product of another category and names the tray's category", () => {
    expect(addToTray(tray("a"), item("cable", CABLES))).toEqual({
      status: "other_category",
      tray: tray("a"),
      current: CHARGERS,
    });
  });

  it("never mutates the given tray", () => {
    const before = tray("a");
    addToTray(before, item("b"));

    expect(before).toEqual(tray("a"));
  });
});

describe("removeFromTray", () => {
  it("removes a product and keeps the order of the rest", () => {
    expect(removeFromTray(tray("a", "b", "c"), "b")).toEqual(tray("a", "c"));
  });

  it("ignores a product that is not there", () => {
    expect(removeFromTray(tray("a"), "z")).toEqual(tray("a"));
  });
});

describe("replaceTray", () => {
  it("starts a new tray with only the given product", () => {
    expect(replaceTray(item("cable", CABLES))).toEqual({
      items: [item("cable", CABLES)],
    });
  });
});

describe("trayCategory", () => {
  it("is the category of the products in the tray, or null when empty", () => {
    expect(trayCategory(tray("a"))).toEqual(CHARGERS);
    expect(trayCategory(EMPTY_TRAY)).toBeNull();
  });
});

describe("parseTray / serializeTray", () => {
  it("round-trips a tray", () => {
    const saved = tray("a", "b");

    expect(parseTray(serializeTray(saved))).toEqual(saved);
  });

  it.each([[null], [""], ["not json"], ["42"], ['{"items":"nope"}']])(
    "reads %j as an empty tray",
    (raw) => {
      expect(parseTray(raw)).toEqual(EMPTY_TRAY);
    },
  );

  it("drops invalid entries, duplicates, other categories and anything past 4", () => {
    const raw = JSON.stringify({
      items: [
        item("a"),
        { slug: "NOT A SLUG", name: "x", category: CHARGERS },
        item("a"),
        item("cable", CABLES),
        item("b"),
        item("c"),
        item("d"),
        item("e"),
      ],
    });

    expect(parseTray(raw)).toEqual(tray("a", "b", "c", "d"));
  });
});
