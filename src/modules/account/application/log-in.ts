import type { CustomerAccount } from "@/modules/account/domain/customer-account";
import { normalizeEmail } from "@/modules/checkout/domain/customer";
import type { AttemptLimiter } from "@/shared/lib/attempt-limiter";
import type {
  CustomerAccountRepository,
  IssuedSession,
  PasswordHasher,
  SessionStore,
} from "./ports";

export type LogInDeps = {
  accounts: CustomerAccountRepository;
  hasher: PasswordHasher;
  sessions: SessionStore;
  /** Failed sign-ins per client key: slows down password guessing. */
  attempts: AttemptLimiter;
};

export type LogInInput = {
  /** Every key the limiter counts for this client (at least one). */
  clientKeys: readonly string[];
  email: string;
  password: string;
  now: Date;
  /** This browser's current session token, ended on success (rotation). */
  previousToken: string | null;
};

export type LogInResult =
  | { ok: true; account: CustomerAccount; issued: IssuedSession }
  | { ok: false; reason: "invalid_credentials" | "too_many_attempts" };

/**
 * Signs a customer in with email and password, throttled per client.
 * An unknown email and a wrong password answer the same and take the same
 * work (the hasher still runs), so the answer never tells whether an
 * account exists. A client with any key blocked is refused before the
 * check. On success the previous session of this browser ends and a new
 * one (new token) starts: a token planted before sign-in is useless after.
 * Throws a RangeError without client keys (it would not be throttled).
 */
export async function logIn(
  { accounts, hasher, sessions, attempts }: LogInDeps,
  { clientKeys, email, password, now, previousToken }: LogInInput,
): Promise<LogInResult> {
  if (clientKeys.length === 0) {
    throw new RangeError("logIn needs at least one client key");
  }
  if (clientKeys.some((key) => attempts.isBlocked(key))) {
    return { ok: false, reason: "too_many_attempts" };
  }

  const credentials = await accounts.findCredentials(normalizeEmail(email));
  const valid = await hasher.verify(password, credentials?.password ?? null);
  const account =
    valid && credentials
      ? await accounts.findById(credentials.accountId)
      : null;
  if (!account) {
    for (const key of clientKeys) attempts.recordFailure(key);
    return { ok: false, reason: "invalid_credentials" };
  }

  if (previousToken) await sessions.revoke(previousToken);
  const issued = await sessions.create(account.id, now);
  return { ok: true, account, issued };
}
