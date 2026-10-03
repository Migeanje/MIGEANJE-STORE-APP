import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False on the server and during hydration, true once the component runs on a
 * hydrated client. Use it to swap a no-JavaScript fallback (a link, a form
 * post) for its enhanced version without a hydration mismatch: the server
 * HTML always has the fallback, so it also works before and without JS.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
