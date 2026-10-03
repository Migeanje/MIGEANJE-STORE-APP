// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CHARGERS } from "@/modules/catalog/testing/catalog-builders";
import {
  type Category,
  categoryRef,
  categorySchema,
  resolveSpecs,
  type SpecDefinition,
  specValueIssue,
} from "./category";

function withSpecs(specSchema: SpecDefinition[]): Category {
  return { ...CHARGERS, specSchema };
}

const POWER = CHARGERS.specSchema[0];
const PORTS = CHARGERS.specSchema[1];

function issuesOf(input: unknown): string[] {
  const result = categorySchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
}

describe("categorySchema", () => {
  it("accepts a category with a spec schema", () => {
    expect(categorySchema.parse(CHARGERS)).toEqual(CHARGERS);
  });

  it("rejects a slug that is not lowercase kebab-case", () => {
    expect(issuesOf({ ...CHARGERS, slug: "Cargadores" })).not.toEqual([]);
    expect(issuesOf({ ...CHARGERS, slug: "hubs_y_docks" })).not.toEqual([]);
  });

  it("names a repeated spec key", () => {
    expect(
      issuesOf(withSpecs([POWER, { ...PORTS, key: "maxPower" }])),
    ).toContain('Spec key "maxPower" is defined twice');
  });

  it("names a repeated spec label (spec lists key their rows by label)", () => {
    expect(
      issuesOf(withSpecs([POWER, { ...PORTS, label: "Potencia máxima" }])),
    ).toContain('Spec label "Potencia máxima" is defined twice');
  });

  it("names a repeated order", () => {
    expect(issuesOf(withSpecs([POWER, { ...PORTS, order: 10 }]))).toContain(
      "Spec order 10 is used twice",
    );
  });

  it("only allows a unit on number specs", () => {
    expect(issuesOf(withSpecs([{ ...PORTS, unit: "W" }]))).toContain(
      'Spec "ports" has a unit but is not a number',
    );
  });

  it("rejects an empty spec schema and unknown kinds", () => {
    expect(issuesOf(withSpecs([]))).not.toEqual([]);
    expect(
      issuesOf({ ...CHARGERS, specSchema: [{ ...POWER, kind: "date" }] }),
    ).not.toEqual([]);
  });
});

describe("categoryRef", () => {
  it("keeps only the slug and the name", () => {
    expect(categoryRef(CHARGERS)).toEqual({
      slug: "cargadores",
      name: "Cargadores",
    });
  });
});

describe("specValueIssue", () => {
  const kinds = Object.fromEntries(
    CHARGERS.specSchema.map((definition) => [definition.kind, definition]),
  ) as Record<SpecDefinition["kind"], SpecDefinition>;

  it.each([
    ["number", 45],
    ["number", 13.6],
    ["text", "GaN"],
    ["boolean", false],
    ["list", ["USB-C", "USB-A"]],
  ] as const)("accepts a valid %s value", (kind, value) => {
    expect(specValueIssue(value, kinds[kind])).toBeNull();
  });

  it.each([
    ["number", "45"],
    ["number", Number.NaN],
    ["text", 45],
    ["text", "  "],
    ["boolean", "true"],
    ["list", "USB-C"],
    ["list", []],
    ["list", ["USB-C", ""]],
    ["list", ["USB-C", "USB-C"]],
  ] as const)("rejects an invalid %s value: %j", (kind, value) => {
    expect(specValueIssue(value, kinds[kind])).toMatch(/^Expected /);
  });
});

describe("resolveSpecs", () => {
  it("returns the present values in schema order with their label and unit", () => {
    const specs = resolveSpecs(
      { display: true, maxPower: 45, ports: ["USB-C"] },
      // The order field decides, not the array position.
      withSpecs([...CHARGERS.specSchema].reverse()),
    );

    expect(specs).toEqual([
      { ...POWER, value: 45 },
      { ...PORTS, value: ["USB-C"] },
      { ...CHARGERS.specSchema[3], value: true },
    ]);
  });
});
