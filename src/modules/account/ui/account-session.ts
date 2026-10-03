// Who is signed in, for Server Components and server actions. Server-only:
// it reads the session cookie and the account store.
import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getSignedInAccount } from "@/modules/account/application/sessions";
import type { CustomerAccount } from "@/modules/account/domain/customer-account";
import {
  getCustomerAccounts,
  getSessionStore,
} from "@/modules/account/infrastructure";
import { readSessionToken } from "@/modules/account/infrastructure/session-cookie";
import { logInHref } from "./account-paths";

/**
 * The account of this request's session cookie, or null. Cached per request
 * (React `cache`), so the header and the page share one lookup. Reading the
 * cookie makes the caller render per request: keep it inside Suspense or in
 * a page that renders per request anyway.
 */
export const loadSignedInAccount = cache(
  async (): Promise<CustomerAccount | null> =>
    getSignedInAccount(
      { accounts: getCustomerAccounts(), sessions: getSessionStore() },
      await readSessionToken(),
      new Date(),
    ),
);

/**
 * The signed-in account; without one, a redirect to the sign-in page that
 * comes back to `returnTo` (a path of this site) afterwards.
 */
export async function requireSignedInAccount(
  returnTo: string,
): Promise<CustomerAccount> {
  const account = await loadSignedInAccount();
  if (!account) redirect(logInHref(returnTo));
  return account;
}
