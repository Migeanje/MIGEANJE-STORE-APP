import { hasFavorite } from "@/modules/account/domain/customer-account";
import { loadSignedInAccount } from "./account-session";
import { toggleFavoriteAction } from "./actions";
import { FavoriteSignInLink, FavoriteToggle } from "./favorite-toggle";

export type FavoriteToggleContainerProps = {
  /** The product's catalog slug. */
  slug: string;
  /** The product page, where a guest comes back after signing in. */
  returnTo: string;
};

/**
 * Server Component: "Guardar en favoritos" for the product page (the route
 * passes it to the catalog's `favorite` slot). A toggle for a signed-in
 * customer, a sign-in link for a guest. It reads the session cookie: render
 * it in a page that renders per request (the product page does), so it is
 * in the server HTML for visits without JavaScript.
 */
export async function FavoriteToggleContainer({
  slug,
  returnTo,
}: FavoriteToggleContainerProps) {
  const account = await loadSignedInAccount();
  if (!account) return <FavoriteSignInLink returnTo={returnTo} />;
  return (
    <FavoriteToggle
      slug={slug}
      initialFavorite={hasFavorite(account, slug)}
      action={toggleFavoriteAction}
      returnTo={returnTo}
    />
  );
}
