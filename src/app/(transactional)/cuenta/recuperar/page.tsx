import type { Metadata } from "next";
import { RecoverPageContainer } from "@/modules/account/ui/auth-pages.containers";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false },
};

/**
 * Password recovery (mock: no email is sent; the answer never says
 * whether an account exists).
 */
export default async function RecoverPasswordPage({
  searchParams,
}: PageProps<"/cuenta/recuperar">) {
  return <RecoverPageContainer searchParams={await searchParams} />;
}
