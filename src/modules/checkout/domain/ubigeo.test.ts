// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  distritosOf,
  provinciasOf,
  resolvedUbigeoSchema,
  resolveUbigeo,
  ubigeoTreeSchema,
} from "./ubigeo";

const TREE = ubigeoTreeSchema.parse([
  {
    code: "07",
    name: "Callao",
    provincias: [
      {
        code: "0701",
        name: "Callao",
        distritos: [
          { code: "070101", name: "Callao" },
          { code: "070102", name: "Bellavista" },
        ],
      },
    ],
  },
  {
    code: "15",
    name: "Lima",
    provincias: [
      {
        code: "1501",
        name: "Lima",
        distritos: [
          { code: "150101", name: "Lima" },
          { code: "150122", name: "Miraflores" },
        ],
      },
      {
        code: "1505",
        name: "Cañete",
        distritos: [{ code: "150501", name: "San Vicente de Cañete" }],
      },
    ],
  },
]);

describe("ubigeoTreeSchema", () => {
  it("requires INEI codes: 2, 4 and 6 digits, each starting with its parent", () => {
    expect(
      ubigeoTreeSchema.safeParse([
        {
          code: "15",
          name: "Lima",
          provincias: [
            {
              code: "0701",
              name: "Callao",
              distritos: [{ code: "070101", name: "Callao" }],
            },
          ],
        },
      ]).success,
    ).toBe(false);
    expect(
      ubigeoTreeSchema.safeParse([
        {
          code: "15",
          name: "Lima",
          provincias: [
            {
              code: "1501",
              name: "Lima",
              distritos: [{ code: "070101", name: "Callao" }],
            },
          ],
        },
      ]).success,
    ).toBe(false);
    expect(
      ubigeoTreeSchema.safeParse([{ code: "1", name: "Lima", provincias: [] }])
        .success,
    ).toBe(false);
  });

  it("rejects duplicate codes", () => {
    const lima = TREE[1];
    expect(ubigeoTreeSchema.safeParse([lima, lima]).success).toBe(false);
  });
});

describe("provinciasOf / distritosOf", () => {
  it("lists the provincias of a departamento", () => {
    expect(provinciasOf(TREE, "15")).toEqual([
      { code: "1501", name: "Lima" },
      { code: "1505", name: "Cañete" },
    ]);
  });

  it("lists the distritos of a provincia", () => {
    expect(distritosOf(TREE, "1501")).toEqual([
      { code: "150101", name: "Lima" },
      { code: "150122", name: "Miraflores" },
    ]);
  });

  it("returns nothing for unknown or empty codes", () => {
    expect(provinciasOf(TREE, "99")).toEqual([]);
    expect(provinciasOf(TREE, "")).toEqual([]);
    expect(distritosOf(TREE, "9999")).toEqual([]);
    expect(distritosOf(TREE, "")).toEqual([]);
  });
});

describe("resolveUbigeo", () => {
  it("returns the names of a consistent departamento, provincia and distrito", () => {
    expect(
      resolveUbigeo(TREE, {
        departamento: "15",
        provincia: "1501",
        distrito: "150122",
      }),
    ).toEqual({
      departamento: { code: "15", name: "Lima" },
      provincia: { code: "1501", name: "Lima" },
      distrito: { code: "150122", name: "Miraflores" },
    });
  });

  it("returns null when a code is unknown or belongs to another parent", () => {
    expect(
      resolveUbigeo(TREE, {
        departamento: "15",
        provincia: "0701",
        distrito: "070101",
      }),
    ).toBeNull();
    expect(
      resolveUbigeo(TREE, {
        departamento: "15",
        provincia: "1501",
        distrito: "150501",
      }),
    ).toBeNull();
    expect(
      resolveUbigeo(TREE, {
        departamento: "15",
        provincia: "1501",
        distrito: "",
      }),
    ).toBeNull();
  });
});

describe("resolvedUbigeoSchema", () => {
  it("rejects codes that do not nest", () => {
    expect(
      resolvedUbigeoSchema.safeParse({
        departamento: { code: "15", name: "Lima" },
        provincia: { code: "0701", name: "Callao" },
        distrito: { code: "070101", name: "Callao" },
      }).success,
    ).toBe(false);
  });
});
