// The confirmation access cookie. Server-only: Server Components read it,
// server actions write it.
import "server-only";
import { cookies } from "next/headers";

export const ORDER_ACCESS_COOKIE = "mg_order";

const ONE_HOUR_IN_SECONDS = 60 * 60;

/**
 * httpOnly, SameSite=Lax, Secure in production, every path, one hour: long
 * enough to read the confirmation right after paying. Later the customer
 * opens it with the order number and email.
 */
export function orderAccessCookieOptions(
  production = process.env.NODE_ENV === "production",
) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: production,
    path: "/",
    maxAge: ONE_HOUR_IN_SECONDS,
  } as const;
}

export type OrderAccess = { number: string; accessToken: string };

/** The order this browser may open, or null (missing or malformed cookie). */
export async function readOrderAccess(): Promise<OrderAccess | null> {
  const value = (await cookies()).get(ORDER_ACCESS_COOKIE)?.value ?? "";
  const [number, accessToken, ...rest] = value.split(".");
  if (!number || !accessToken || rest.length > 0) return null;
  return { number, accessToken };
}

/**
 * Forgets the order this browser may open (only from a server action), e.g.
 * "Consultar otro pedido" on the tracking page.
 */
export async function clearOrderAccess(): Promise<void> {
  (await cookies()).set(ORDER_ACCESS_COOKIE, "", {
    ...orderAccessCookieOptions(),
    maxAge: 0,
  });
}

/**
 * Lets this browser open the confirmation and the tracking of one order
 * (only from a server action). The value is the order number plus its
 * secret access token, so knowing a number is not enough.
 */
export async function writeOrderAccess({
  number,
  accessToken,
}: OrderAccess): Promise<void> {
  (await cookies()).set(
    ORDER_ACCESS_COOKIE,
    `${number}.${accessToken}`,
    orderAccessCookieOptions(),
  );
}
