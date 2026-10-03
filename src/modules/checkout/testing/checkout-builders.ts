// Test-only builders for the checkout module. Never import from production code.
import type {
  CheckoutDraftRepository,
  UbigeoDirectory,
} from "@/modules/checkout/application/ports";
import type {
  CheckoutDraft,
  ContactDetails,
} from "@/modules/checkout/domain/checkout-draft";
import type { Receipt } from "@/modules/checkout/domain/receipt";
import {
  type UbigeoTree,
  ubigeoTreeSchema,
} from "@/modules/checkout/domain/ubigeo";

export const BOLETA: Receipt = { type: "boleta" };

export function aFactura(overrides: Partial<Receipt> = {}): Receipt {
  return {
    type: "factura",
    ruc: "20131312955",
    businessName: "Empresa Demo S.A.C.",
    fiscalAddress: "Av. Garcilaso de la Vega 1472, Lima",
    ...overrides,
  } as Receipt;
}

/** A guest in Miraflores (Lima Metropolitana) with a DNI. */
export function aContact(
  overrides: Partial<ContactDetails> = {},
): ContactDetails {
  return {
    customer: {
      firstName: "Ana",
      lastName: "Pérez Quispe",
      email: "ana@correo.pe",
      phone: "987654321",
      document: { type: "dni", number: "46027897" },
    },
    address: {
      line: "Av. Larco 1234, dpto. 501",
      reference: "Frente al parque",
      ubigeo: {
        departamento: { code: "15", name: "Lima" },
        provincia: { code: "1501", name: "Lima" },
        distrito: { code: "150122", name: "Miraflores" },
      },
    },
    ...overrides,
  };
}

/** The same guest, shipping to Cayma (Arequipa: rest of Peru). */
export function anArequipaContact(): ContactDetails {
  const contact = aContact();
  return {
    ...contact,
    address: {
      line: "Calle Mercaderes 210",
      reference: "",
      ubigeo: {
        departamento: { code: "04", name: "Arequipa" },
        provincia: { code: "0401", name: "Arequipa" },
        distrito: { code: "040103", name: "Cayma" },
      },
    },
  };
}

/** A small ubigeo tree: Lima (two provincias), Callao and Arequipa. */
export function aUbigeoTree(): UbigeoTree {
  return ubigeoTreeSchema.parse([
    {
      code: "04",
      name: "Arequipa",
      provincias: [
        {
          code: "0401",
          name: "Arequipa",
          distritos: [
            { code: "040101", name: "Arequipa" },
            { code: "040103", name: "Cayma" },
          ],
        },
      ],
    },
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
}

export function fakeUbigeo(tree: UbigeoTree = aUbigeoTree()): UbigeoDirectory {
  return {
    async tree() {
      return tree;
    },
  };
}

/** A Map-backed CheckoutDraftRepository. */
export function fakeDrafts(initial: CheckoutDraft[] = []) {
  const store = new Map(initial.map((draft) => [draft.cartId, draft]));
  const repository: CheckoutDraftRepository = {
    async get(cartId) {
      return store.get(cartId) ?? null;
    },
    async save(draft) {
      store.set(draft.cartId, draft);
    },
    async delete(cartId) {
      store.delete(cartId);
    },
  };
  return { repository, store };
}
