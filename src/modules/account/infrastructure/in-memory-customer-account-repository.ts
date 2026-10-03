import type { CustomerAccountRepository } from "@/modules/account/application/ports";
import {
  type PasswordHash,
  passwordHashSchema,
} from "@/modules/account/domain/credentials";
import {
  type CustomerAccount,
  customerAccountSchema,
} from "@/modules/account/domain/customer-account";

export type StoredAccount = {
  account: CustomerAccount;
  password: PasswordHash;
};

export type InMemoryCustomerAccountRepositoryOptions = {
  /** Accounts to start with (e.g. the demo account). */
  seed?: readonly StoredAccount[];
};

/**
 * CustomerAccountRepository over a Map, for `DATA_SOURCE=mock` and tests.
 * One account per (normalized) email; accounts and hashes are validated
 * before they are stored and deep-copied on every read and write.
 */
export function createInMemoryCustomerAccountRepository({
  seed = [],
}: InMemoryCustomerAccountRepositoryOptions = {}): CustomerAccountRepository {
  const byId = new Map<string, StoredAccount>();
  const idByEmail = new Map<string, string>();

  function insert(account: CustomerAccount, password: PasswordHash) {
    const valid = customerAccountSchema.parse(account);
    const hash = passwordHashSchema.parse(password);
    if (idByEmail.has(valid.email)) return "email_taken" as const;
    if (byId.has(valid.id)) throw new Error(`Account ${valid.id} exists`);
    byId.set(valid.id, structuredClone({ account: valid, password: hash }));
    idByEmail.set(valid.email, valid.id);
    return "created" as const;
  }

  for (const { account, password } of seed) {
    if (insert(account, password) === "email_taken") {
      throw new Error(`Two seed accounts use ${account.email}`);
    }
  }

  return {
    async create(account, password) {
      return insert(account, password);
    },
    async findById(id) {
      const stored = byId.get(id);
      return stored ? structuredClone(stored.account) : null;
    },
    async findCredentials(email) {
      const id = idByEmail.get(email);
      const stored = id ? byId.get(id) : undefined;
      return stored
        ? { accountId: stored.account.id, password: { ...stored.password } }
        : null;
    },
    async save(account) {
      const valid = customerAccountSchema.parse(account);
      const stored = byId.get(valid.id);
      if (!stored) throw new Error(`Unknown account ${valid.id}`);
      if (stored.account.email !== valid.email) {
        throw new Error("An account's email never changes");
      }
      byId.set(valid.id, { ...stored, account: structuredClone(valid) });
    },
  };
}
