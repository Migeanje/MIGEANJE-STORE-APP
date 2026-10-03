"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AccountLink } from "@/shared/ui/molecules/account-link";
import { ACCOUNT_PATHS } from "./account-paths";
import { readAccountNameAction } from "./actions";

export type AccountHeaderLinkProps = {
  /** The signed-in first name, or null; `readAccountNameAction` by default. */
  load?: () => Promise<string | null>;
};

function SignedInAccountLink({ load }: Required<AccountHeaderLinkProps>) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [firstName, setFirstName] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: every navigation asks again (signing in or out redirects; a profile change adds ?aviso=).
  useEffect(() => {
    let current = true;
    load().then(
      (name) => {
        if (current) setFirstName(name);
      },
      () => {
        // Keep the plain link.
      },
    );
    return () => {
      current = false;
    };
  }, [load, pathname, search]);

  return <AccountLink href={ACCOUNT_PATHS.home} firstName={firstName} />;
}

/**
 * The header's account control for the root layout (`SiteHeaderContainer`'s
 * `account` slot). The layout never reads the session cookie (pages stay
 * static), so the server HTML is the plain "Mi cuenta" link (also without
 * JavaScript); the browser then asks for the signed-in first name, again
 * after every navigation.
 */
export function AccountHeaderLink({
  load = readAccountNameAction,
}: AccountHeaderLinkProps) {
  return (
    // useSearchParams needs a boundary to keep static pages prerendered.
    <Suspense fallback={<AccountLink href={ACCOUNT_PATHS.home} />}>
      <SignedInAccountLink load={load} />
    </Suspense>
  );
}
