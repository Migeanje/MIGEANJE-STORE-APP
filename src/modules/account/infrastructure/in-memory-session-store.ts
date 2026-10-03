import { createHash, randomBytes } from "node:crypto";
import type { SessionStore } from "@/modules/account/application/ports";
import {
  isSessionActive,
  type Session,
  sessionExpiry,
} from "@/modules/account/domain/session";

/** 32 random bytes in base64url: 43 characters. */
export const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function digest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type InMemorySessionStoreOptions = {
  /** Sessions by the SHA-256 of their token. */
  store?: Map<string, Session>;
};

/**
 * SessionStore over a Map, for `DATA_SOURCE=mock` and tests. Tokens are 256
 * random bits; the map keeps only their SHA-256, so whoever reads the store
 * cannot use a session. Expired sessions are dropped when found and when a
 * new session is issued.
 */
export function createInMemorySessionStore({
  store = new Map(),
}: InMemorySessionStoreOptions = {}): SessionStore {
  function prune(now: Date) {
    for (const [key, session] of store) {
      if (!isSessionActive(session, now)) store.delete(key);
    }
  }

  return {
    async create(customerId, now) {
      prune(now);
      const token = randomBytes(32).toString("base64url");
      const session: Session = {
        customerId,
        createdAt: now.toISOString(),
        expiresAt: sessionExpiry(now).toISOString(),
      };
      store.set(digest(token), session);
      return { token, session: { ...session } };
    },
    async find(token, now) {
      if (!SESSION_TOKEN_PATTERN.test(token)) return null;
      const key = digest(token);
      const session = store.get(key);
      if (!session) return null;
      if (!isSessionActive(session, now)) {
        store.delete(key);
        return null;
      }
      return { ...session };
    },
    async revoke(token) {
      store.delete(digest(token));
    },
  };
}
