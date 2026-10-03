/*
 * A signed-in session: who it belongs to and until when. It lasts 7 days
 * from sign-in (absolute, not sliding); signing in again starts a new one.
 */

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type Session = {
  customerId: string;
  /** ISO date-time. */
  createdAt: string;
  /** ISO date-time. */
  expiresAt: string;
};

/** When a session opened at `now` expires. */
export function sessionExpiry(now: Date): Date {
  return new Date(now.getTime() + SESSION_TTL_MS);
}

export function isSessionActive(session: Session, now: Date): boolean {
  return now.getTime() < new Date(session.expiresAt).getTime();
}
