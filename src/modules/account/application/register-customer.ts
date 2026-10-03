import { randomUUID } from "node:crypto";
import {
  type CustomerAccount,
  customerAccountSchema,
} from "@/modules/account/domain/customer-account";
import { failedPasswordRules } from "@/modules/account/domain/password-policy";
import { normalizeEmail } from "@/modules/checkout/domain/customer";
import type { AttemptLimiter } from "@/shared/lib/attempt-limiter";
import type {
  CustomerAccountRepository,
  IssuedSession,
  PasswordHasher,
  SessionStore,
} from "./ports";

export type RegisterCustomerDeps = {
  accounts: CustomerAccountRepository;
  hasher: PasswordHasher;
  sessions: SessionStore;
  /** The sign-in limiter: hitting existing emails counts as a failure. */
  attempts: AttemptLimiter;
  /** Account ids; random UUIDs by default. */
  newId?: () => string;
};

export type RegisterCustomerInput = {
  clientKeys: readonly string[];
  firstName: string;
  lastName: string;
  email: string;
  /** Mobile number without +51, or null. */
  phone: string | null;
  password: string;
  now: Date;
  previousToken: string | null;
};

export type RegisterCustomerResult =
  | { ok: true; account: CustomerAccount; issued: IssuedSession }
  | { ok: false; reason: "email_taken" | "too_many_attempts" };

/**
 * Creates an account (validated, password hashed with its own salt) and
 * signs it in, ending this browser's previous session.
 *
 * An email that already has an account is refused ("email_taken": the form
 * has to say so) and counts as a failed attempt for the client, like a
 * wrong password, so nobody can test many emails quickly. Throws for input
 * the form should have refused (a weak password, invalid data) and without
 * client keys.
 */
export async function registerCustomer(
  {
    accounts,
    hasher,
    sessions,
    attempts,
    newId = randomUUID,
  }: RegisterCustomerDeps,
  input: RegisterCustomerInput,
): Promise<RegisterCustomerResult> {
  const { clientKeys, password, now, previousToken } = input;
  if (clientKeys.length === 0) {
    throw new RangeError("registerCustomer needs at least one client key");
  }
  if (failedPasswordRules(password).length > 0) {
    throw new RangeError("The password breaks the password rules");
  }
  if (clientKeys.some((key) => attempts.isBlocked(key))) {
    return { ok: false, reason: "too_many_attempts" };
  }

  const account = customerAccountSchema.parse({
    id: newId(),
    firstName: input.firstName,
    lastName: input.lastName,
    email: normalizeEmail(input.email),
    phone: input.phone,
    document: null,
    addresses: [],
    defaultAddressId: null,
    favorites: [],
    createdAt: now.toISOString(),
  });
  const outcome = await accounts.create(account, await hasher.hash(password));
  if (outcome === "email_taken") {
    for (const key of clientKeys) attempts.recordFailure(key);
    return { ok: false, reason: "email_taken" };
  }

  if (previousToken) await sessions.revoke(previousToken);
  const issued = await sessions.create(account.id, now);
  return { ok: true, account, issued };
}
