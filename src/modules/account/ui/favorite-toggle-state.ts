/** What `toggleFavoriteAction` answers (`useActionState`). */
export type FavoriteToggleState = {
  /** Whether the product is in the favorites now. */
  favorite: boolean;
  /** Announced in the toggle's status. */
  message: string | null;
  tone: "default" | "error";
  attempt: number;
};

export function initialFavoriteState(favorite: boolean): FavoriteToggleState {
  return { favorite, message: null, tone: "default", attempt: 0 };
}

/** The form fields of the toggle. */
export const FAVORITE_FIELDS = {
  slug: "slug",
  /** The state asked for: "si" saves, "no" removes. */
  favorite: "favorito",
  /** Where a guest comes back after signing in. */
  returnTo: "volver",
} as const;
