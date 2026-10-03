import type {
  PendingReconciliation,
  ReconciliationLog,
} from "@/modules/orders/application/ports";

export type InMemoryReconciliationLog = ReconciliationLog & {
  /** Every pending reconciliation, oldest first. */
  list(): Promise<PendingReconciliation[]>;
};

/**
 * ReconciliationLog over an array, for `DATA_SOURCE=mock` and tests: lost on
 * restart. The structured server log `order_persist_failed_after_charge` is
 * the trail that survives it. Entries are deep-copied on every read and write.
 */
export function createInMemoryReconciliationLog(): InMemoryReconciliationLog {
  const entries: PendingReconciliation[] = [];
  return {
    async record(entry) {
      entries.push(structuredClone(entry));
    },
    async findByCart(cartId) {
      const entry = entries.findLast((pending) => pending.cartId === cartId);
      return entry ? structuredClone(entry) : null;
    },
    async list() {
      return structuredClone(entries);
    },
  };
}
