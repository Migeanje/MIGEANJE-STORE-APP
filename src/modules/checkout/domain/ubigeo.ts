import * as z from "zod";

/*
 * Ubigeo: INEI's codes for Peru's departamentos (2 digits), provincias (4)
 * and distritos (6); each code starts with its parent's. Addresses carry the
 * three codes (shipping zones depend on them) plus their names (a snapshot
 * for receipts and the order).
 */

const placeName = z.string().trim().min(1);

export const ubigeoPlaceSchema = z.strictObject({
  code: z.string(),
  name: placeName,
});

const distritoSchema = z.strictObject({
  code: z.string().regex(/^\d{6}$/, "Expected a 6-digit distrito code"),
  name: placeName,
});

const provinciaSchema = z
  .strictObject({
    code: z.string().regex(/^\d{4}$/, "Expected a 4-digit provincia code"),
    name: placeName,
    distritos: z.array(distritoSchema).min(1),
  })
  .refine(
    (provincia) =>
      provincia.distritos.every(({ code }) => code.startsWith(provincia.code)),
    { message: "A distrito code must start with its provincia code" },
  );

const departamentoSchema = z
  .strictObject({
    code: z.string().regex(/^\d{2}$/, "Expected a 2-digit departamento code"),
    name: placeName,
    provincias: z.array(provinciaSchema).min(1),
  })
  .refine(
    (departamento) =>
      departamento.provincias.every(({ code }) =>
        code.startsWith(departamento.code),
      ),
    { message: "A provincia code must start with its departamento code" },
  );

function allUnique(codes: string[]): boolean {
  return new Set(codes).size === codes.length;
}

/** Departamentos with their provincias and distritos. */
export const ubigeoTreeSchema = z
  .array(departamentoSchema)
  .refine(
    (tree) =>
      allUnique(tree.map(({ code }) => code)) &&
      allUnique(
        tree.flatMap(({ provincias }) => provincias.map((p) => p.code)),
      ) &&
      allUnique(
        tree.flatMap(({ provincias }) =>
          provincias.flatMap(({ distritos }) => distritos.map((d) => d.code)),
        ),
      ),
    { message: "Ubigeo codes must be unique" },
  );

/** The three places of an address, with codes that nest. */
export const resolvedUbigeoSchema = z
  .strictObject({
    departamento: z.strictObject({
      code: z.string().regex(/^\d{2}$/),
      name: placeName,
    }),
    provincia: z.strictObject({
      code: z.string().regex(/^\d{4}$/),
      name: placeName,
    }),
    distrito: z.strictObject({
      code: z.string().regex(/^\d{6}$/),
      name: placeName,
    }),
  })
  .refine(
    ({ departamento, provincia, distrito }) =>
      provincia.code.startsWith(departamento.code) &&
      distrito.code.startsWith(provincia.code),
    { message: "Ubigeo codes must nest", path: ["distrito"] },
  );

export type UbigeoTree = z.infer<typeof ubigeoTreeSchema>;
export type UbigeoDepartamento = UbigeoTree[number];
export type UbigeoPlace = z.infer<typeof ubigeoPlaceSchema>;
export type ResolvedUbigeo = z.infer<typeof resolvedUbigeoSchema>;
/** The codes a form sends: "15", "1501", "150122". */
export type UbigeoCodes = {
  departamento: string;
  provincia: string;
  distrito: string;
};

function place({ code, name }: UbigeoPlace): UbigeoPlace {
  return { code, name };
}

/** The departamentos, without their children (for a select). */
export function departamentosOf(tree: UbigeoTree): UbigeoPlace[] {
  return tree.map(place);
}

/** The provincias of a departamento; empty for an unknown code. */
export function provinciasOf(
  tree: UbigeoTree,
  departamentoCode: string,
): UbigeoPlace[] {
  const departamento = tree.find(({ code }) => code === departamentoCode);
  return departamento ? departamento.provincias.map(place) : [];
}

/** The distritos of a provincia; empty for an unknown code. */
export function distritosOf(
  tree: UbigeoTree,
  provinciaCode: string,
): UbigeoPlace[] {
  for (const departamento of tree) {
    const provincia = departamento.provincias.find(
      ({ code }) => code === provinciaCode,
    );
    if (provincia) return provincia.distritos.map(place);
  }
  return [];
}

/**
 * The names of a departamento, provincia and distrito that exist and nest in
 * the tree, or null (unknown code, or a child of another parent).
 */
export function resolveUbigeo(
  tree: UbigeoTree,
  codes: UbigeoCodes,
): ResolvedUbigeo | null {
  const departamento = tree.find(({ code }) => code === codes.departamento);
  const provincia = departamento?.provincias.find(
    ({ code }) => code === codes.provincia,
  );
  const distrito = provincia?.distritos.find(
    ({ code }) => code === codes.distrito,
  );
  if (!departamento || !provincia || !distrito) return null;
  return {
    departamento: place(departamento),
    provincia: place(provincia),
    distrito: place(distrito),
  };
}
