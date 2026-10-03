import type { Metadata } from "next";
import { RegisterPageContainer } from "@/modules/account/ui/auth-pages.containers";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false },
};

/**
 * Registration.
 */
export default async function RegisterPage({
  searchParams,
}: PageProps<"/cuenta/registro">) {
  return <RegisterPageContainer searchParams={await searchParams} />;
}
