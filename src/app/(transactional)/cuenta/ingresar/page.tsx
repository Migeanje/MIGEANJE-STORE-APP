import type { Metadata } from "next";
import { LogInPageContainer } from "@/modules/account/ui/auth-pages.containers";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false },
};

/**
 * Sign-in (`?volver=` comes back to a page of this site afterwards).
 */
export default async function LogInPage({
  searchParams,
}: PageProps<"/cuenta/ingresar">) {
  return <LogInPageContainer searchParams={await searchParams} />;
}
