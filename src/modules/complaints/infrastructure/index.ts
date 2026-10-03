// Composition root of the complaints module. `server-only` turns an import
// from a Client Component into a build error: complaint sheets hold personal
// data.
import "server-only";
import type {
  ComplaintNotifier,
  ComplaintRepository,
} from "@/modules/complaints/application/ports";
import { readDataSource } from "@/shared/lib/data-source";
import { createInMemoryComplaintRepository } from "./in-memory-complaint-repository";
import {
  createMockComplaintNotifier,
  type MockComplaintNotifier,
} from "./mock-complaint-notifier";

// DEV ONLY: with DATA_SOURCE=mock, the book and the outbox live in this
// process's memory (on globalThis, so dev hot reloads keep them). Lost on
// restart, not shared between server instances: never a real Libro de
// Reclamaciones, which must keep every sheet (see the legal notes in
// complaint-copy.ts).
const MOCK_BOOK = Symbol.for("migeanje-store.complaints.mock-repository");
const MOCK_OUTBOX = Symbol.for("migeanje-store.complaints.mock-notifier");
type MockComplaintsGlobal = typeof globalThis & {
  [MOCK_BOOK]?: ComplaintRepository;
  [MOCK_OUTBOX]?: MockComplaintNotifier;
};

function medusaNotReady(what: string): never {
  throw new Error(
    `DATA_SOURCE=medusa is not implemented yet: the Medusa ${what} adapter arrives in F3. Use DATA_SOURCE=mock.`,
  );
}

/** The Libro de Reclamaciones of the data source selected by `DATA_SOURCE`. */
export function getComplaintRepository(): ComplaintRepository {
  switch (readDataSource()) {
    case "mock": {
      const global = globalThis as MockComplaintsGlobal;
      global[MOCK_BOOK] ??= createInMemoryComplaintRepository();
      return global[MOCK_BOOK];
    }
    case "medusa":
      return medusaNotReady("complaint");
  }
}

function mockNotifier(): MockComplaintNotifier {
  const global = globalThis as MockComplaintsGlobal;
  global[MOCK_OUTBOX] ??= createMockComplaintNotifier();
  return global[MOCK_OUTBOX];
}

/** Sends the consumer's copy (an in-memory outbox with mock data). */
export function getComplaintNotifier(): ComplaintNotifier {
  switch (readDataSource()) {
    case "mock":
      return mockNotifier();
    case "medusa":
      return medusaNotReady("complaint email");
  }
}

/** True with mock data: the page says no real email is sent. */
export function isDemoComplaintBook(): boolean {
  return readDataSource() === "mock";
}

/** The mock outbox (copies "sent"); null unless DATA_SOURCE=mock. */
export function getComplaintOutbox(): MockComplaintNotifier | null {
  return readDataSource() === "mock" ? mockNotifier() : null;
}
