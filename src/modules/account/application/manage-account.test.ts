// @vitest-environment node
import { describe, expect, it } from "vitest";
import { MAX_ADDRESSES } from "@/modules/account/domain/customer-account";
import {
  ACCOUNT_ID,
  addressId,
  anAccount,
  anAddress,
  anArequipaAddress,
  fakeAccounts,
} from "@/modules/account/testing/account-builders";
import {
  deleteAddress,
  makeDefaultAddress,
  saveAddress,
  setFavorite,
  updateCustomerProfile,
} from "./manage-account";

function repositoryWith(account = anAccount()) {
  return fakeAccounts([{ account, password: "x" }]);
}

const { id: _id, ...arequipa } = anArequipaAddress();

describe("updateCustomerProfile", () => {
  it("saves the new names and phone", async () => {
    const { repository, accounts } = repositoryWith();

    const result = await updateCustomerProfile(repository, ACCOUNT_ID, {
      firstName: "Ana María",
      lastName: "Pérez",
      phone: null,
    });

    expect(result).toEqual({
      ok: true,
      account: {
        ...anAccount(),
        firstName: "Ana María",
        lastName: "Pérez",
        phone: null,
      },
    });
    expect(accounts.get(ACCOUNT_ID)?.firstName).toBe("Ana María");
  });

  it("answers not_found for an account that does not exist", async () => {
    const { repository } = fakeAccounts();
    expect(
      await updateCustomerProfile(repository, ACCOUNT_ID, {
        firstName: "A",
        lastName: "B",
        phone: null,
      }),
    ).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("saveAddress", () => {
  it("adds a new address with a fresh id (the first one is the default)", async () => {
    const { repository, accounts } = repositoryWith();

    const result = await saveAddress(
      repository,
      ACCOUNT_ID,
      { ...arequipa, id: null, makeDefault: false },
      () => addressId(5),
    );

    expect(result.ok).toBe(true);
    expect(accounts.get(ACCOUNT_ID)?.addresses).toEqual([
      { ...arequipa, id: addressId(5) },
    ]);
    expect(accounts.get(ACCOUNT_ID)?.defaultAddressId).toBe(addressId(5));
  });

  it("edits an existing address and can make it the default", async () => {
    const { repository, accounts } = repositoryWith(
      anAccount({
        addresses: [anAddress(), anArequipaAddress()],
        defaultAddressId: addressId(1),
      }),
    );

    await saveAddress(
      repository,
      ACCOUNT_ID,
      {
        ...arequipa,
        line: "Calle Nueva 1",
        id: addressId(2),
        makeDefault: true,
      },
      () => addressId(9),
    );

    const saved = accounts.get(ACCOUNT_ID);
    expect(saved?.addresses[1]).toEqual({
      ...anArequipaAddress(),
      line: "Calle Nueva 1",
    });
    expect(saved?.defaultAddressId).toBe(addressId(2));
  });

  it("answers not_found when editing an address that is gone", async () => {
    const { repository } = repositoryWith();
    expect(
      await saveAddress(
        repository,
        ACCOUNT_ID,
        { ...arequipa, id: addressId(7), makeDefault: false },
        () => addressId(9),
      ),
    ).toEqual({ ok: false, reason: "not_found" });
  });

  it(`answers address_limit after ${MAX_ADDRESSES} addresses`, async () => {
    const addresses = Array.from({ length: MAX_ADDRESSES }, (_, n) =>
      anAddress({ id: addressId(n + 1) }),
    );
    const { repository } = repositoryWith(
      anAccount({ addresses, defaultAddressId: addressId(1) }),
    );
    expect(
      await saveAddress(
        repository,
        ACCOUNT_ID,
        { ...arequipa, id: null, makeDefault: false },
        () => addressId(99),
      ),
    ).toEqual({ ok: false, reason: "address_limit" });
  });
});

describe("deleteAddress and makeDefaultAddress", () => {
  const twoAddresses = () =>
    anAccount({
      addresses: [anAddress(), anArequipaAddress()],
      defaultAddressId: addressId(1),
    });

  it("deletes an address", async () => {
    const { repository, accounts } = repositoryWith(twoAddresses());
    expect((await deleteAddress(repository, ACCOUNT_ID, addressId(1))).ok).toBe(
      true,
    );
    expect(accounts.get(ACCOUNT_ID)?.addresses).toEqual([anArequipaAddress()]);
  });

  it("makes another address the default", async () => {
    const { repository, accounts } = repositoryWith(twoAddresses());
    await makeDefaultAddress(repository, ACCOUNT_ID, addressId(2));
    expect(accounts.get(ACCOUNT_ID)?.defaultAddressId).toBe(addressId(2));
    expect(
      await makeDefaultAddress(repository, ACCOUNT_ID, addressId(9)),
    ).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("setFavorite", () => {
  it("saves and removes a favorite product", async () => {
    const { repository, accounts } = repositoryWith();

    expect(
      await setFavorite(repository, ACCOUNT_ID, "producto-a", true),
    ).toMatchObject({ ok: true });
    expect(accounts.get(ACCOUNT_ID)?.favorites).toEqual(["producto-a"]);

    await setFavorite(repository, ACCOUNT_ID, "producto-a", false);
    expect(accounts.get(ACCOUNT_ID)?.favorites).toEqual([]);
  });

  it("answers favorites_limit when the list is full", async () => {
    const { repository } = repositoryWith(
      anAccount({
        favorites: Array.from({ length: 100 }, (_, n) => `p-${n}`),
      }),
    );
    expect(await setFavorite(repository, ACCOUNT_ID, "otro", true)).toEqual({
      ok: false,
      reason: "favorites_limit",
    });
  });

  it("answers invalid_product for something that is not a product slug", async () => {
    const { repository } = repositoryWith();
    expect(await setFavorite(repository, ACCOUNT_ID, "<script>", true)).toEqual(
      { ok: false, reason: "invalid_product" },
    );
  });
});
