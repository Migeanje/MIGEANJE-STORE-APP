import type { PasswordHash } from "@/modules/account/domain/credentials";
import type { CustomerAccount } from "@/modules/account/domain/customer-account";

/*
 * DEMO DATA for DATA_SOURCE=mock only: an account anyone can open with the
 * documented email and password (CLAUDE.md, and the hint on the sign-in
 * page). It owns the demo orders (same email) and starts with two
 * addresses and two favorites. A test keeps its favorites in the catalog,
 * its places in the mock ubigeo and its hash matching the password.
 */

export const DEMO_ACCOUNT_PASSWORD = "Demo-2026!";

export const DEMO_ACCOUNT: CustomerAccount = {
  id: "d3e0a1c4-5b6f-4c7d-8e9f-0a1b2c3d4e5f",
  firstName: "Lucía",
  lastName: "Demo",
  email: "demo@migeanje.pe",
  phone: "900000000",
  document: { type: "dni", number: "00000000" },
  addresses: [
    {
      id: "5a0c9e4e-1d2b-4c3a-9f8e-7d6c5b4a3f21",
      label: "Casa",
      line: "Av. José Pardo 500, dpto. 302",
      reference: "Cerca al óvalo Gutiérrez",
      ubigeo: {
        departamento: { code: "15", name: "Lima" },
        provincia: { code: "1501", name: "Lima" },
        distrito: { code: "150122", name: "Miraflores" },
      },
    },
    {
      id: "8b7a6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d",
      label: "Oficina",
      line: "Calle Mercaderes 210, oficina 4",
      reference: "",
      ubigeo: {
        departamento: { code: "04", name: "Arequipa" },
        provincia: { code: "0401", name: "Arequipa" },
        distrito: { code: "040101", name: "Arequipa" },
      },
    },
  ],
  defaultAddressId: "5a0c9e4e-1d2b-4c3a-9f8e-7d6c5b4a3f21",
  favorites: ["anker-prime-charger-100w-3-puertos", "soundcore-liberty-5"],
  createdAt: "2026-09-15T15:00:00.000Z",
};

/**
 * scrypt (N=2^17, r=8, p=1) of DEMO_ACCOUNT_PASSWORD, computed once so the
 * mock store starts without spending a hash on every server start.
 */
export const DEMO_ACCOUNT_PASSWORD_HASH: PasswordHash = {
  algorithm: "scrypt",
  cost: 131072,
  blockSize: 8,
  parallelization: 1,
  salt: "CK32hMIhQFUEn3lmzzUDBg==",
  hash: "YLktY1YsJCoaNe1yXffBTNmbY3c8XPHvj6m8IThO2iUbuYqTxN1hXT7qdUJF1TjqWCGIWhgimOSnK1cnHIcXVw==",
};
