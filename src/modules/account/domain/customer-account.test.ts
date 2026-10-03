// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  addressId,
  anAccount,
  anAddress,
  anArequipaAddress,
  EMAIL_VERIFIED_AT,
} from "@/modules/account/testing/account-builders";
import {
  addAddress,
  addFavorite,
  canAddAddress,
  canAddFavorite,
  customerAccountSchema,
  defaultAddress,
  hasFavorite,
  isEmailVerified,
  MAX_ADDRESSES,
  MAX_FAVORITES,
  removeAddress,
  removeFavorite,
  replaceAddress,
  setDefaultAddress,
  updateProfile,
} from "./customer-account";

const withTwoAddresses = () =>
  anAccount({
    addresses: [anAddress(), anArequipaAddress()],
    defaultAddressId: addressId(1),
  });

describe("customerAccountSchema", () => {
  it("accepts an account with addresses and favorites", () => {
    const account = withTwoAddresses();
    expect(customerAccountSchema.parse(account)).toEqual(account);
    expect(
      customerAccountSchema.parse({
        ...account,
        phone: null,
        document: { type: "dni", number: "46027897" },
        favorites: ["anker-prime-charger-100w-3-puertos"],
      }).favorites,
    ).toHaveLength(1);
  });

  it.each([
    ["an email that is not normalized", { email: "Ana@Correo.pe" }],
    ["a phone that is not a mobile", { phone: "014567890" }],
    [
      "a default address that does not exist",
      { defaultAddressId: addressId(9) },
    ],
    ["addresses without a default", { defaultAddressId: null }],
    [
      "two addresses with the same id",
      { addresses: [anAddress(), anArequipaAddress({ id: addressId(1) })] },
    ],
    ["the same favorite twice", { favorites: ["a-b", "a-b"] }],
    ["a favorite that is not a slug", { favorites: ["../../etc"] }],
    ["a verification that is not a date", { emailVerifiedAt: "ayer" }],
    ["a verification that is not text", { emailVerifiedAt: true }],
  ])("refuses %s", (_name, change) => {
    expect(
      customerAccountSchema.safeParse({ ...withTwoAddresses(), ...change })
        .success,
    ).toBe(false);
  });

  it("refuses a default address when there are none", () => {
    expect(
      customerAccountSchema.safeParse(
        anAccount({ defaultAddressId: addressId(1) }),
      ).success,
    ).toBe(false);
  });

  it("needs to know whether the email is verified", () => {
    const withoutVerification = Object.fromEntries(
      Object.entries(anAccount()).filter(([key]) => key !== "emailVerifiedAt"),
    );
    expect(customerAccountSchema.safeParse(withoutVerification).success).toBe(
      false,
    );
    expect(
      customerAccountSchema.parse(
        anAccount({ emailVerifiedAt: EMAIL_VERIFIED_AT }),
      ).emailVerifiedAt,
    ).toBe(EMAIL_VERIFIED_AT);
  });
});

describe("isEmailVerified", () => {
  it("is true only once the email has a verification date", () => {
    expect(isEmailVerified(anAccount())).toBe(false);
    expect(
      isEmailVerified(anAccount({ emailVerifiedAt: EMAIL_VERIFIED_AT })),
    ).toBe(true);
  });

  it("is false for an account stored before the field existed", () => {
    const legacy = { ...anAccount(), emailVerifiedAt: undefined };
    expect(isEmailVerified(legacy as never)).toBe(false);
  });
});

describe("updateProfile", () => {
  it("changes the names and the phone only", () => {
    const account = anAccount();
    const updated = updateProfile(account, {
      firstName: "Ana María",
      lastName: "Pérez",
      phone: null,
    });
    expect(updated).toEqual({
      ...account,
      firstName: "Ana María",
      lastName: "Pérez",
      phone: null,
    });
    expect(account.firstName).toBe("Ana");
  });

  it("never changes whether the email is verified", () => {
    const verified = anAccount({ emailVerifiedAt: EMAIL_VERIFIED_AT });
    expect(
      updateProfile(verified, {
        firstName: "Ana",
        lastName: "Pérez",
        phone: null,
      }).emailVerifiedAt,
    ).toBe(EMAIL_VERIFIED_AT);
  });
});

describe("addresses", () => {
  it("makes the first address the default one", () => {
    const account = addAddress(anAccount(), anAddress());
    expect(defaultAddress(account)).toEqual(anAddress());
  });

  it("keeps the default unless the new address asks for it", () => {
    const one = addAddress(anAccount(), anAddress());
    expect(addAddress(one, anArequipaAddress()).defaultAddressId).toBe(
      addressId(1),
    );
    expect(
      addAddress(one, anArequipaAddress(), { makeDefault: true })
        .defaultAddressId,
    ).toBe(addressId(2));
  });

  it(`allows at most ${MAX_ADDRESSES} addresses`, () => {
    let account = anAccount();
    for (let n = 1; n <= MAX_ADDRESSES; n += 1) {
      expect(canAddAddress(account)).toBe(true);
      account = addAddress(account, anAddress({ id: addressId(n) }));
    }
    expect(canAddAddress(account)).toBe(false);
    expect(() => addAddress(account, anAddress({ id: addressId(99) }))).toThrow(
      RangeError,
    );
  });

  it("refuses an id that is already used", () => {
    expect(() => addAddress(withTwoAddresses(), anAddress())).toThrow(
      RangeError,
    );
  });

  it("replaces an address in place and can make it the default", () => {
    const changed = anArequipaAddress({ line: "Calle Nueva 1" });
    const account = replaceAddress(withTwoAddresses(), changed, {
      makeDefault: true,
    });
    expect(account.addresses.map(({ line }) => line)).toEqual([
      "Av. Larco 1234, dpto. 501",
      "Calle Nueva 1",
    ]);
    expect(account.defaultAddressId).toBe(addressId(2));
    expect(() =>
      replaceAddress(anAccount(), anAddress({ id: addressId(7) })),
    ).toThrow(RangeError);
  });

  it("moves the default to the first address left after removing it", () => {
    const account = removeAddress(withTwoAddresses(), addressId(1));
    expect(account.addresses).toEqual([anArequipaAddress()]);
    expect(account.defaultAddressId).toBe(addressId(2));

    const empty = removeAddress(account, addressId(2));
    expect(empty.addresses).toEqual([]);
    expect(empty.defaultAddressId).toBeNull();
    expect(defaultAddress(empty)).toBeNull();
  });

  it("ignores removing an address that is not there", () => {
    const account = withTwoAddresses();
    expect(removeAddress(account, addressId(9))).toEqual(account);
  });

  it("sets the default to an existing address only", () => {
    expect(
      setDefaultAddress(withTwoAddresses(), addressId(2)).defaultAddressId,
    ).toBe(addressId(2));
    expect(() => setDefaultAddress(withTwoAddresses(), addressId(9))).toThrow(
      RangeError,
    );
  });
});

describe("favorites", () => {
  it("adds a product once, newest first", () => {
    let account = addFavorite(anAccount(), "producto-a");
    account = addFavorite(account, "producto-b");
    account = addFavorite(account, "producto-a");
    expect(account.favorites).toEqual(["producto-b", "producto-a"]);
    expect(hasFavorite(account, "producto-a")).toBe(true);
    expect(hasFavorite(account, "producto-c")).toBe(false);
  });

  it("removes a product (and ignores one that is not there)", () => {
    const account = anAccount({ favorites: ["producto-a", "producto-b"] });
    expect(removeFavorite(account, "producto-a").favorites).toEqual([
      "producto-b",
    ]);
    expect(removeFavorite(account, "producto-z")).toEqual(account);
  });

  it(`keeps at most ${MAX_FAVORITES} favorites`, () => {
    const full = anAccount({
      favorites: Array.from({ length: MAX_FAVORITES }, (_, n) => `p-${n}`),
    });
    expect(canAddFavorite(full, "p-0")).toBe(true);
    expect(canAddFavorite(full, "otro")).toBe(false);
    expect(() => addFavorite(full, "otro")).toThrow(RangeError);
  });

  it("refuses a slug that is not one", () => {
    expect(() => addFavorite(anAccount(), "No Es Slug")).toThrow(RangeError);
  });
});
