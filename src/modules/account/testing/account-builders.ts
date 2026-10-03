// Test-only builders for the account module. Never import from production code.
import type {
  AccountCredentials,
  CustomerAccountRepository,
  IssuedSession,
  PasswordHasher,
  SessionStore,
} from "@/modules/account/application/ports";
import type { PasswordHash } from "@/modules/account/domain/credentials";
import type {
  AccountAddress,
  CustomerAccount,
} from "@/modules/account/domain/customer-account";
import { type Session, sessionExpiry } from "@/modules/account/domain/session";
import { createAttemptLimiter } from "@/shared/lib/attempt-limiter";

export const ACCOUNT_ID = "6f1c2b3a-4d5e-4f60-8a7b-9c0d1e2f3a4b";
export const NOW = new Date("2026-10-03T15:00:00Z");

/** Address ids are UUIDs. */
export function addressId(n: number): string {
  return `0000000${n}-0000-4000-8000-000000000000`.slice(-36);
}

/** An address in Miraflores (Lima Metropolitana). */
export function anAddress(
  overrides: Partial<AccountAddress> = {},
): AccountAddress {
  return {
    id: addressId(1),
    label: "Casa",
    line: "Av. Larco 1234, dpto. 501",
    reference: "Frente al parque",
    ubigeo: {
      departamento: { code: "15", name: "Lima" },
      provincia: { code: "1501", name: "Lima" },
      distrito: { code: "150122", name: "Miraflores" },
    },
    ...overrides,
  };
}

/** An address in Cayma (Arequipa). */
export function anArequipaAddress(
  overrides: Partial<AccountAddress> = {},
): AccountAddress {
  return anAddress({
    id: addressId(2),
    label: "Oficina",
    line: "Calle Mercaderes 210",
    reference: "",
    ubigeo: {
      departamento: { code: "04", name: "Arequipa" },
      provincia: { code: "0401", name: "Arequipa" },
      distrito: { code: "040103", name: "Cayma" },
    },
    ...overrides,
  });
}

/** Ana, without addresses or favorites. */
export function anAccount(
  overrides: Partial<CustomerAccount> = {},
): CustomerAccount {
  return {
    id: ACCOUNT_ID,
    firstName: "Ana",
    lastName: "Pérez Quispe",
    email: "ana@correo.pe",
    phone: "987654321",
    document: null,
    addresses: [],
    defaultAddressId: null,
    favorites: [],
    createdAt: "2026-09-01T15:00:00.000Z",
    ...overrides,
  };
}

/** A fake hash that only `fakeHasher` understands: "hash:<password>". */
export function fakeHash(password: string): PasswordHash {
  return {
    algorithm: "scrypt",
    cost: 2,
    blockSize: 1,
    parallelization: 1,
    salt: "c2FsdA==",
    hash: Buffer.from(`hash:${password}`).toString("base64"),
  };
}

/** A PasswordHasher without cryptography, recording `verify(…, null)`. */
export function fakeHasher() {
  const calls = { verifyWithoutHash: 0 };
  const hasher: PasswordHasher = {
    async hash(password) {
      return fakeHash(password);
    },
    async verify(password, hash) {
      if (hash === null) {
        calls.verifyWithoutHash += 1;
        return false;
      }
      return hash.hash === fakeHash(password).hash;
    },
  };
  return { hasher, calls };
}

/** A Map-backed CustomerAccountRepository. */
export function fakeAccounts(
  initial: { account: CustomerAccount; password: string }[] = [],
) {
  const accounts = new Map<string, CustomerAccount>();
  const passwords = new Map<string, PasswordHash>();
  for (const { account, password } of initial) {
    accounts.set(account.id, account);
    passwords.set(account.id, fakeHash(password));
  }
  const byEmail = (email: string) =>
    [...accounts.values()].find((account) => account.email === email);
  const repository: CustomerAccountRepository = {
    async create(account, password) {
      if (byEmail(account.email)) return "email_taken";
      accounts.set(account.id, account);
      passwords.set(account.id, password);
      return "created";
    },
    async findById(id) {
      return accounts.get(id) ?? null;
    },
    async findCredentials(email): Promise<AccountCredentials | null> {
      const account = byEmail(email);
      const password = account ? passwords.get(account.id) : undefined;
      return account && password ? { accountId: account.id, password } : null;
    },
    async save(account) {
      if (!accounts.has(account.id)) throw new Error("Unknown account");
      accounts.set(account.id, account);
    },
  };
  return { repository, accounts };
}

/** A Map-backed SessionStore issuing tokens "token-1", "token-2"… */
export function fakeSessions() {
  const sessions = new Map<string, Session>();
  const revoked: string[] = [];
  let sequence = 0;
  const store: SessionStore = {
    async create(customerId, now): Promise<IssuedSession> {
      sequence += 1;
      const token = `token-${sequence}`;
      const session: Session = {
        customerId,
        createdAt: now.toISOString(),
        expiresAt: sessionExpiry(now).toISOString(),
      };
      sessions.set(token, session);
      return { token, session };
    },
    async find(token, now) {
      const session = sessions.get(token);
      return session && new Date(session.expiresAt) > now ? session : null;
    },
    async revoke(token) {
      revoked.push(token);
      sessions.delete(token);
    },
  };
  return { store, sessions, revoked };
}

export function anAttemptLimiter() {
  return createAttemptLimiter({ maxFailures: 3, windowMs: 60_000 });
}
