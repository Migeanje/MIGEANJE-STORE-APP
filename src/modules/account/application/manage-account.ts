import { randomUUID } from "node:crypto";
import {
  type AccountAddress,
  addAddress,
  addFavorite,
  type CustomerAccount,
  canAddAddress,
  canAddFavorite,
  isProductSlug,
  type ProfileChanges,
  removeAddress,
  removeFavorite,
  replaceAddress,
  setDefaultAddress,
  updateProfile,
} from "@/modules/account/domain/customer-account";
import type { CustomerAccountRepository } from "./ports";

/*
 * Changes a signed-in customer makes to their own account. The account id
 * always comes from the session (never from the form). Each use case loads
 * the account, applies one domain change and saves it; what the customer can
 * cause (a full address book, an address deleted in another tab) is an
 * answer, not an error.
 */

export type AccountChangeResult<R extends string> =
  | { ok: true; account: CustomerAccount }
  | { ok: false; reason: "not_found" | R };

async function change<R extends string>(
  accounts: CustomerAccountRepository,
  accountId: string,
  apply: (account: CustomerAccount) => CustomerAccount | R | "not_found",
): Promise<AccountChangeResult<R>> {
  const account = await accounts.findById(accountId);
  if (!account) return { ok: false, reason: "not_found" };
  const changed = apply(account);
  if (typeof changed === "string") return { ok: false, reason: changed };
  await accounts.save(changed);
  return { ok: true, account: changed };
}

export function updateCustomerProfile(
  accounts: CustomerAccountRepository,
  accountId: string,
  changes: ProfileChanges,
): Promise<AccountChangeResult<never>> {
  return change<never>(accounts, accountId, (account) =>
    updateProfile(account, changes),
  );
}

export type AddressInput = Omit<AccountAddress, "id"> & {
  /** null adds a new address; an id edits that one. */
  id: string | null;
  makeDefault: boolean;
};

/** Adds or edits an address of the address book. */
export function saveAddress(
  accounts: CustomerAccountRepository,
  accountId: string,
  { id, makeDefault, ...fields }: AddressInput,
  newId: () => string = randomUUID,
): Promise<AccountChangeResult<"address_limit">> {
  return change(accounts, accountId, (account) => {
    if (id === null) {
      if (!canAddAddress(account)) return "address_limit";
      return addAddress(account, { id: newId(), ...fields }, { makeDefault });
    }
    if (!account.addresses.some((address) => address.id === id)) {
      return "not_found";
    }
    return replaceAddress(account, { id, ...fields }, { makeDefault });
  });
}

export function deleteAddress(
  accounts: CustomerAccountRepository,
  accountId: string,
  addressId: string,
): Promise<AccountChangeResult<never>> {
  return change<never>(accounts, accountId, (account) =>
    removeAddress(account, addressId),
  );
}

export function makeDefaultAddress(
  accounts: CustomerAccountRepository,
  accountId: string,
  addressId: string,
): Promise<AccountChangeResult<never>> {
  return change<never>(accounts, accountId, (account) =>
    account.addresses.some(({ id }) => id === addressId)
      ? setDefaultAddress(account, addressId)
      : "not_found",
  );
}

/** Saves (`favorite` true) or removes a product from the favorites. */
export function setFavorite(
  accounts: CustomerAccountRepository,
  accountId: string,
  slug: string,
  favorite: boolean,
): Promise<AccountChangeResult<"favorites_limit" | "invalid_product">> {
  return change(accounts, accountId, (account) => {
    if (!isProductSlug(slug)) return "invalid_product";
    if (!favorite) return removeFavorite(account, slug);
    if (!canAddFavorite(account, slug)) return "favorites_limit";
    return addFavorite(account, slug);
  });
}
