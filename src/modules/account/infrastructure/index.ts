// Composition root of the account module. `server-only` turns an import from
// a Client Component into a build error: accounts hold personal data and
// password hashes.
import "server-only";
import type {
  CustomerAccountRepository,
  PasswordHasher,
  SessionStore,
} from "@/modules/account/application/ports";
import {
  type AttemptLimiter,
  createAttemptLimiter,
} from "@/shared/lib/attempt-limiter";
import { readDataSource } from "@/shared/lib/data-source";
import {
  DEMO_ACCOUNT,
  DEMO_ACCOUNT_PASSWORD,
  DEMO_ACCOUNT_PASSWORD_HASH,
} from "./fixtures/demo-account";
import { createInMemoryCustomerAccountRepository } from "./in-memory-customer-account-repository";
import { createInMemorySessionStore } from "./in-memory-session-store";
import { createScryptPasswordHasher } from "./scrypt-password-hasher";

// DEV ONLY: with DATA_SOURCE=mock, accounts and sessions live in this
// process's memory (on globalThis, so dev hot reloads keep them). Lost on
// restart (everyone is signed out), not shared between server instances.
const MOCK_ACCOUNTS = Symbol.for("migeanje-store.account.mock-accounts");
const MOCK_SESSIONS = Symbol.for("migeanje-store.account.mock-sessions");
const LOGIN_ATTEMPTS = Symbol.for("migeanje-store.account.login-attempts");
type AccountGlobal = typeof globalThis & {
  [MOCK_ACCOUNTS]?: CustomerAccountRepository;
  [MOCK_SESSIONS]?: SessionStore;
  [LOGIN_ATTEMPTS]?: AttemptLimiter;
};

function medusaNotReady(what: string): never {
  throw new Error(
    `DATA_SOURCE=medusa is not implemented yet: the Medusa ${what} adapter arrives in F3. Use DATA_SOURCE=mock.`,
  );
}

/** Customer accounts; the mock store starts with the demo account. */
export function getCustomerAccounts(): CustomerAccountRepository {
  switch (readDataSource()) {
    case "mock": {
      const global = globalThis as AccountGlobal;
      global[MOCK_ACCOUNTS] ??= createInMemoryCustomerAccountRepository({
        seed: [{ account: DEMO_ACCOUNT, password: DEMO_ACCOUNT_PASSWORD_HASH }],
      });
      return global[MOCK_ACCOUNTS];
    }
    case "medusa":
      return medusaNotReady("customer");
  }
}

/** Signed-in sessions (Medusa auth sessions in F3). */
export function getSessionStore(): SessionStore {
  switch (readDataSource()) {
    case "mock": {
      const global = globalThis as AccountGlobal;
      global[MOCK_SESSIONS] ??= createInMemorySessionStore();
      return global[MOCK_SESSIONS];
    }
    case "medusa":
      return medusaNotReady("session");
  }
}

/** scrypt with OWASP's minimum parameters. */
export function getPasswordHasher(): PasswordHasher {
  return createScryptPasswordHasher();
}

// Failed sign-ins (and registrations with a taken email) per client key.
const LOGIN_MAX_FAILURES = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Failed sign-ins per client key (10 per 15 minutes), keys from
 * `identifyClient` (`shared/lib/client-key.ts`). In this process's memory: a
 * best-effort guard; real rate limiting belongs to the edge or the backend.
 */
export function getLoginAttempts(): AttemptLimiter {
  const global = globalThis as AccountGlobal;
  global[LOGIN_ATTEMPTS] ??= createAttemptLimiter({
    maxFailures: LOGIN_MAX_FAILURES,
    windowMs: LOGIN_WINDOW_MS,
  });
  return global[LOGIN_ATTEMPTS];
}

export type DemoAccountHint = { email: string; password: string };

/** The demo account to hint on the sign-in page; null unless DATA_SOURCE=mock. */
export function getDemoAccountHint(): DemoAccountHint | null {
  return readDataSource() === "mock"
    ? { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT_PASSWORD }
    : null;
}
