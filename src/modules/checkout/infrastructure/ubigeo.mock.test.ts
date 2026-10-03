// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  distritosOf,
  provinciasOf,
  resolveUbigeo,
  ubigeoTreeSchema,
} from "@/modules/checkout/domain/ubigeo";
import { UBIGEO_FIXTURE } from "./fixtures/ubigeo";
import { createMockUbigeoDirectory } from "./ubigeo.mock";

describe("ubigeo fixture", () => {
  it("parses with the domain schema", () => {
    expect(ubigeoTreeSchema.safeParse(UBIGEO_FIXTURE).success).toBe(true);
  });

  it("lists the 25 departamentos (Callao included), sorted by code", () => {
    const codes = UBIGEO_FIXTURE.map(({ code }) => code);
    expect(codes).toHaveLength(25);
    expect(codes).toEqual(
      Array.from({ length: 25 }, (_, index) =>
        String(index + 1).padStart(2, "0"),
      ),
    );
  });

  it("has every provincia of the main departamentos", () => {
    const tree = ubigeoTreeSchema.parse(UBIGEO_FIXTURE);
    expect(provinciasOf(tree, "15")).toHaveLength(10); // Lima
    expect(provinciasOf(tree, "07")).toHaveLength(1); // Callao
    expect(provinciasOf(tree, "04")).toHaveLength(8); // Arequipa
    expect(provinciasOf(tree, "08")).toHaveLength(13); // Cusco
    expect(provinciasOf(tree, "13")).toHaveLength(12); // La Libertad
    expect(provinciasOf(tree, "20")).toHaveLength(8); // Piura
    expect(provinciasOf(tree, "14")).toHaveLength(3); // Lambayeque
  });

  it("has the 43 distritos of Lima Metropolitana and the 7 of Callao", () => {
    const tree = ubigeoTreeSchema.parse(UBIGEO_FIXTURE);
    expect(distritosOf(tree, "1501")).toHaveLength(43);
    expect(distritosOf(tree, "0701")).toHaveLength(7);
  });

  it("knows the capital of every departamento", () => {
    const tree = ubigeoTreeSchema.parse(UBIGEO_FIXTURE);
    for (const { code } of tree) {
      expect(
        resolveUbigeo(tree, {
          departamento: code,
          provincia: `${code}01`,
          distrito: `${code}0101`,
        }),
        `capital of ${code}`,
      ).not.toBeNull();
    }
  });

  it("resolves well-known distritos", () => {
    const tree = ubigeoTreeSchema.parse(UBIGEO_FIXTURE);
    expect(
      resolveUbigeo(tree, {
        departamento: "15",
        provincia: "1501",
        distrito: "150122",
      })?.distrito.name,
    ).toBe("Miraflores");
    expect(
      resolveUbigeo(tree, {
        departamento: "04",
        provincia: "0401",
        distrito: "040103",
      })?.distrito.name,
    ).toBe("Cayma");
  });
});

describe("createMockUbigeoDirectory", () => {
  it("returns the parsed, deeply frozen tree", async () => {
    const tree = await createMockUbigeoDirectory().tree();
    expect(tree).toHaveLength(25);
    expect(Object.isFrozen(tree)).toBe(true);
    expect(Object.isFrozen(tree[0]?.provincias[0]?.distritos[0])).toBe(true);
  });
});
