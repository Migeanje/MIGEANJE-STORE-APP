// The constancia access cookie. Server-only: Server Components read it,
// server actions write it.
import "server-only";
import { cookies } from "next/headers";

export const COMPLAINT_ACCESS_COOKIE = "mg_complaint";

const ONE_HOUR_IN_SECONDS = 60 * 60;

/**
 * httpOnly, SameSite=Lax, Secure in production, every path, one hour: long
 * enough to print the constancia right after filing. Afterwards the consumer
 * has the copy sent to their email.
 */
export function complaintAccessCookieOptions(
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

export type ComplaintAccess = { number: string; accessToken: string };

/** The sheet this browser may open, or null (missing or malformed cookie). */
export async function readComplaintAccess(): Promise<ComplaintAccess | null> {
  const value = (await cookies()).get(COMPLAINT_ACCESS_COOKIE)?.value ?? "";
  const [number, accessToken, ...rest] = value.split(".");
  if (!number || !accessToken || rest.length > 0) return null;
  return { number, accessToken };
}

/**
 * Lets this browser open the constancia of one sheet (only from a server
 * action). The value is the sheet number plus its secret access token:
 * numbers are correlative, so knowing one is not enough.
 */
export async function writeComplaintAccess({
  number,
  accessToken,
}: ComplaintAccess): Promise<void> {
  (await cookies()).set(
    COMPLAINT_ACCESS_COOKIE,
    `${number}.${accessToken}`,
    complaintAccessCookieOptions(),
  );
}
