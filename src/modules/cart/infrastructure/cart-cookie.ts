// The cart id cookie. Server-only: Server Components read it, server actions
// write it (Next.js only sets cookies from server actions and route handlers).
import "server-only";
import { cookies } from "next/headers";
import { cartIdSchema } from "@/modules/cart/domain/cart";

export const CART_COOKIE = "mg_cart";

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

/**
 * httpOnly (scripts never see the id), SameSite=Lax (sent on top-level
 * navigations, not on cross-site posts), Secure in production, every path,
 * 30 days (renewed on every change to the cart).
 */
export function cartCookieOptions(
  production = process.env.NODE_ENV === "production",
) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: production,
    path: "/",
    maxAge: THIRTY_DAYS_IN_SECONDS,
  } as const;
}

/** The cart id of this browser, or undefined when missing or malformed. */
export async function readCartId(): Promise<string | undefined> {
  const value = (await cookies()).get(CART_COOKIE)?.value;
  return cartIdSchema.safeParse(value).success ? value : undefined;
}

/** Stores the cart id (only from a server action). Throws for a non-UUID. */
export async function writeCartId(id: string): Promise<void> {
  const value = cartIdSchema.parse(id);
  (await cookies()).set(CART_COOKIE, value, cartCookieOptions());
}
