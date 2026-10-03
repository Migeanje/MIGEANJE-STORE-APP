import * as z from "zod";
import {
  identityDocumentSchema,
  MOBILE_PATTERN,
  normalizeEmail,
  personNameSchema,
} from "@/modules/checkout/domain/customer";
import { resolvedUbigeoSchema } from "@/modules/checkout/domain/ubigeo";

/*
 * A customer account: who the customer is (names, email, optional mobile and
 * document), the address book (ubigeo-based, one default address) and the
 * favorite products (catalog slugs). The password lives apart (credentials),
 * so an account can travel to the UI without it. Every change below returns
 * a new account; invalid changes (programming errors) throw a RangeError.
 */

export const MAX_ADDRESSES = 10;
export const MAX_FAVORITES = 100;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** A catalog product slug ("anker-prime-charger-100w-3-puertos"). */
export const PRODUCT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 120;

export const accountAddressSchema = z.strictObject({
  id: z.string().regex(UUID, "Expected a UUID"),
  /** "Casa", "Oficina"; may be empty. */
  label: z.string().trim().max(40),
  line: z.string().trim().min(1).max(150),
  reference: z.string().trim().max(150),
  ubigeo: resolvedUbigeoSchema,
});

function allUnique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

export const customerAccountSchema = z
  .strictObject({
    id: z.string().regex(UUID, "Expected a UUID"),
    firstName: personNameSchema,
    lastName: personNameSchema,
    /** Normalized (lowercase): unique per account, case-insensitively. */
    email: z
      .email()
      .max(254)
      .refine((email) => email === normalizeEmail(email), {
        message: "Expected a normalized (trimmed, lowercase) email",
      }),
    /**
     * When the customer proved they own the email (a link sent to it), or
     * null. Registering proves nothing: anyone can type someone else's
     * email. Only a verified account lists the orders placed with its email.
     */
    emailVerifiedAt: z.iso.datetime().nullable(),
    /** Mobile number without +51, or null. */
    phone: z
      .string()
      .regex(MOBILE_PATTERN, "Expected a Peruvian mobile number")
      .nullable(),
    document: identityDocumentSchema.nullable(),
    addresses: z.array(accountAddressSchema).max(MAX_ADDRESSES),
    /** Null exactly when there are no addresses. */
    defaultAddressId: z.string().nullable(),
    /** Product slugs, newest first. */
    favorites: z
      .array(z.string().max(MAX_SLUG_LENGTH).regex(PRODUCT_SLUG_PATTERN))
      .max(MAX_FAVORITES),
    createdAt: z.iso.datetime(),
  })
  .refine((account) => allUnique(account.addresses.map(({ id }) => id)), {
    message: "Address ids must be unique",
    path: ["addresses"],
  })
  .refine(
    ({ addresses, defaultAddressId }) =>
      addresses.length === 0
        ? defaultAddressId === null
        : addresses.some(({ id }) => id === defaultAddressId),
    {
      message: "The default address must be one of the addresses",
      path: ["defaultAddressId"],
    },
  )
  .refine((account) => allUnique(account.favorites), {
    message: "Favorites must be unique",
    path: ["favorites"],
  });

export type CustomerAccount = z.infer<typeof customerAccountSchema>;
export type AccountAddress = z.infer<typeof accountAddressSchema>;

export type ProfileChanges = Pick<
  CustomerAccount,
  "firstName" | "lastName" | "phone"
>;

/**
 * Whether the customer has proven they own the account's email. False for
 * anything but a verification date (an account stored before the field
 * existed included).
 */
export function isEmailVerified(account: CustomerAccount): boolean {
  return typeof account.emailVerifiedAt === "string";
}

/** New names and phone; the email (and its verification) never changes here. */
export function updateProfile(
  account: CustomerAccount,
  changes: ProfileChanges,
): CustomerAccount {
  return {
    ...account,
    firstName: changes.firstName,
    lastName: changes.lastName,
    phone: changes.phone,
  };
}

export function defaultAddress(
  account: CustomerAccount,
): AccountAddress | null {
  return (
    account.addresses.find(({ id }) => id === account.defaultAddressId) ?? null
  );
}

export function canAddAddress(account: CustomerAccount): boolean {
  return account.addresses.length < MAX_ADDRESSES;
}

export type AddressOptions = { makeDefault?: boolean };

/** Adds an address; the first one (or one asked for) becomes the default. */
export function addAddress(
  account: CustomerAccount,
  address: AccountAddress,
  { makeDefault = false }: AddressOptions = {},
): CustomerAccount {
  if (!canAddAddress(account)) {
    throw new RangeError(`An account keeps at most ${MAX_ADDRESSES} addresses`);
  }
  if (account.addresses.some(({ id }) => id === address.id)) {
    throw new RangeError(`Address ${address.id} already exists`);
  }
  return {
    ...account,
    addresses: [...account.addresses, address],
    defaultAddressId:
      makeDefault || account.defaultAddressId === null
        ? address.id
        : account.defaultAddressId,
  };
}

/** Replaces the address with the same id, in place. */
export function replaceAddress(
  account: CustomerAccount,
  address: AccountAddress,
  { makeDefault = false }: AddressOptions = {},
): CustomerAccount {
  if (!account.addresses.some(({ id }) => id === address.id)) {
    throw new RangeError(`Unknown address ${address.id}`);
  }
  return {
    ...account,
    addresses: account.addresses.map((existing) =>
      existing.id === address.id ? address : existing,
    ),
    defaultAddressId: makeDefault ? address.id : account.defaultAddressId,
  };
}

/**
 * Removes an address (nothing happens for an unknown id). Removing the
 * default one makes the first address left the default.
 */
export function removeAddress(
  account: CustomerAccount,
  addressId: string,
): CustomerAccount {
  if (!account.addresses.some(({ id }) => id === addressId)) return account;
  const addresses = account.addresses.filter(({ id }) => id !== addressId);
  return {
    ...account,
    addresses,
    defaultAddressId:
      account.defaultAddressId === addressId
        ? (addresses[0]?.id ?? null)
        : account.defaultAddressId,
  };
}

export function setDefaultAddress(
  account: CustomerAccount,
  addressId: string,
): CustomerAccount {
  if (!account.addresses.some(({ id }) => id === addressId)) {
    throw new RangeError(`Unknown address ${addressId}`);
  }
  return { ...account, defaultAddressId: addressId };
}

export function isProductSlug(value: string): boolean {
  return value.length <= MAX_SLUG_LENGTH && PRODUCT_SLUG_PATTERN.test(value);
}

export function hasFavorite(account: CustomerAccount, slug: string): boolean {
  return account.favorites.includes(slug);
}

/** Whether `slug` fits in the favorites (it is there already, or there is room). */
export function canAddFavorite(
  account: CustomerAccount,
  slug: string,
): boolean {
  return hasFavorite(account, slug) || account.favorites.length < MAX_FAVORITES;
}

/** Saves a product first in the favorites (once). */
export function addFavorite(
  account: CustomerAccount,
  slug: string,
): CustomerAccount {
  if (!isProductSlug(slug)) {
    throw new RangeError(`Not a product slug: ${JSON.stringify(slug)}`);
  }
  if (hasFavorite(account, slug)) return account;
  if (!canAddFavorite(account, slug)) {
    throw new RangeError(`An account keeps at most ${MAX_FAVORITES} favorites`);
  }
  return { ...account, favorites: [slug, ...account.favorites] };
}

export function removeFavorite(
  account: CustomerAccount,
  slug: string,
): CustomerAccount {
  if (!hasFavorite(account, slug)) return account;
  return {
    ...account,
    favorites: account.favorites.filter((favorite) => favorite !== slug),
  };
}
