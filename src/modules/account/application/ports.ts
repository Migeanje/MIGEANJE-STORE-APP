import type { PasswordHash } from "@/modules/account/domain/credentials";
import type { CustomerAccount } from "@/modules/account/domain/customer-account";
import type { Session } from "@/modules/account/domain/session";

/** What signing in needs from an account: who it is and its password hash. */
export type AccountCredentials = { accountId: string; password: PasswordHash };

/**
 * Port: where customer accounts are kept (in memory for `DATA_SOURCE=mock`,
 * Medusa customers in F3). Emails are normalized (lowercase) by the callers.
 */
export interface CustomerAccountRepository {
  /**
   * Adds a new account with its password hash in one step: "email_taken"
   * (and nothing stored) when the email already has an account.
   */
  create(
    account: CustomerAccount,
    password: PasswordHash,
  ): Promise<"created" | "email_taken">;
  findById(id: string): Promise<CustomerAccount | null>;
  findCredentials(email: string): Promise<AccountCredentials | null>;
  /** Saves changes to an existing account; its email never changes. */
  save(account: CustomerAccount): Promise<void>;
}

/** Port: one-way password hashing (scrypt). */
export interface PasswordHasher {
  hash(password: string): Promise<PasswordHash>;
  /**
   * Whether the password matches, compared in constant time. With a null
   * hash (an unknown email) it does the same work and answers false, so the
   * response time does not tell whether an account exists.
   */
  verify(password: string, hash: PasswordHash | null): Promise<boolean>;
}

/** A new session and the secret token that opens it (the cookie value). */
export type IssuedSession = { token: string; session: Session };

/** Port: signed-in sessions, found by their secret token. */
export interface SessionStore {
  create(customerId: string, now: Date): Promise<IssuedSession>;
  /** The active session of a token; null when unknown or expired. */
  find(token: string, now: Date): Promise<Session | null>;
  /** Ends a session (nothing happens for an unknown token). */
  revoke(token: string): Promise<void>;
}
