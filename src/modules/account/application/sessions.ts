import type { CustomerAccount } from "@/modules/account/domain/customer-account";
import type { CustomerAccountRepository, SessionStore } from "./ports";

export type SignedInDeps = {
  accounts: CustomerAccountRepository;
  sessions: SessionStore;
};

/**
 * The account of an active session token, or null (no token, unknown or
 * expired session, or an account that no longer exists).
 */
export async function getSignedInAccount(
  { accounts, sessions }: SignedInDeps,
  token: string | null,
  now: Date,
): Promise<CustomerAccount | null> {
  if (!token) return null;
  const session = await sessions.find(token, now);
  return session ? accounts.findById(session.customerId) : null;
}

/** Ends the session of this token (if there is one). */
export async function logOut(
  sessions: SessionStore,
  token: string | null,
): Promise<void> {
  if (token) await sessions.revoke(token);
}
