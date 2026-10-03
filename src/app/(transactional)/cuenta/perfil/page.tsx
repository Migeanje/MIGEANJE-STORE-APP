import type { Metadata } from "next";
import { ProfilePageContainer } from "@/modules/account/ui/account-pages.containers";

export const metadata: Metadata = {
  title: "Mis datos",
  robots: { index: false },
};

/**
 * Names and mobile of the signed-in account.
 */
export default async function ProfilePage({
  searchParams,
}: PageProps<"/cuenta/perfil">) {
  return <ProfilePageContainer searchParams={await searchParams} />;
}
