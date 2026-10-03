"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useActionState, useId } from "react";
import { cn } from "@/shared/lib/cn";
import { chipClassName } from "@/shared/ui/atoms/chip";
import { FAVORITE_TOGGLE_COPY } from "./account-copy";
import { logInHref } from "./account-paths";
import {
  FAVORITE_FIELDS,
  type FavoriteToggleState,
  initialFavoriteState,
} from "./favorite-toggle-state";

/** `toggleFavoriteAction`. */
export type ToggleFavoriteAction = (
  state: FavoriteToggleState,
  formData: FormData,
) => Promise<FavoriteToggleState>;

export type FavoriteToggleProps = {
  /** The product's catalog slug. */
  slug: string;
  /** Whether the product is a favorite when the page renders. */
  initialFavorite: boolean;
  action: ToggleFavoriteAction;
  /** The product page, in case the session ended meanwhile. */
  returnTo: string;
};

/**
 * "Guardar en favoritos" for a signed-in customer: a toggle button
 * (`aria-pressed`, same look as "Comparar") inside a form that posts to the
 * server action, so it also works without JavaScript. While the answer is
 * on its way the button already shows the new state; the result is
 * announced in a polite status.
 */
export function FavoriteToggle({
  slug,
  initialFavorite,
  action,
  returnTo,
}: FavoriteToggleProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialFavoriteState(initialFavorite),
  );
  // The submit always asks for the opposite of the current state.
  const pressed = pending ? !state.favorite : state.favorite;

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name={FAVORITE_FIELDS.slug} value={slug} />
      <input type="hidden" name={FAVORITE_FIELDS.returnTo} value={returnTo} />
      <input
        type="hidden"
        name={FAVORITE_FIELDS.favorite}
        value={state.favorite ? "no" : "si"}
      />
      <button
        type="submit"
        aria-pressed={pressed}
        aria-disabled={pending || undefined}
        onClick={(event) => {
          // One request at a time; the button stays focusable.
          if (pending) event.preventDefault();
        }}
        className={chipClassName}
      >
        <Heart aria-hidden="true" className={cn(pressed && "fill-current")} />
        {FAVORITE_TOGGLE_COPY.save}
      </button>
      {/* Always rendered, so screen readers notice when it changes. */}
      <p
        role="status"
        className={cn(
          "text-body-sm",
          state.tone === "error" ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {state.message}
      </p>
    </form>
  );
}

/**
 * "Guardar en favoritos" for a guest: a link (same look as the toggle) to
 * sign in, coming back to the product afterwards. A link, not a toggle:
 * nothing is saved until the customer signs in.
 */
export function FavoriteSignInLink({ returnTo }: { returnTo: string }) {
  const hintId = useId();
  return (
    <div className="flex flex-col items-start gap-2">
      <Link
        href={logInHref(returnTo)}
        aria-describedby={hintId}
        className={chipClassName}
      >
        <Heart aria-hidden="true" />
        {FAVORITE_TOGGLE_COPY.save}
      </Link>
      <p id={hintId} className="text-body-sm text-muted-foreground">
        {FAVORITE_TOGGLE_COPY.guestHint}
      </p>
    </div>
  );
}
