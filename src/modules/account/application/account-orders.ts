import {
  type CustomerAccount,
  isEmailVerified,
} from "@/modules/account/domain/customer-account";

/**
 * Port: the orders placed with an email, newest first (the orders module's
 * lookup, passed in by the /cuenta routes: the account never imports
 * orders).
 */
export type OrdersByEmail<Order> = (email: string) => Promise<readonly Order[]>;

export type AccountOrders<Order> =
  | { status: "listed"; orders: readonly Order[] }
  | { status: "email_unverified" };

/**
 * The orders of a signed-in account: those placed with its email, only once
 * the account has verified that email. Registering does not prove the email
 * is yours, and an order is otherwise opened only with its number (the
 * secret of a guest order) plus the email, so an unverified account gets
 * "email_unverified" and the lookup is never called.
 */
export async function listAccountOrders<Order>(
  account: CustomerAccount,
  findOrders: OrdersByEmail<Order>,
): Promise<AccountOrders<Order>> {
  if (!isEmailVerified(account)) return { status: "email_unverified" };
  return { status: "listed", orders: await findOrders(account.email) };
}
