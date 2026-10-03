import { LogOut } from "lucide-react";
import { Button } from "@/shared/ui/atoms/button";
import { AccountNav } from "@/shared/ui/molecules/account-nav";
import { ACCOUNT_NAV_ITEMS, LOG_OUT_LABEL } from "./account-copy";
import { logOutAction } from "./actions";

/**
 * The account sections with "Cerrar sesión" (a form posting to the server
 * action, so it works without JavaScript).
 */
export function AccountNavigation({ current }: { current: string }) {
  return (
    <AccountNav
      items={ACCOUNT_NAV_ITEMS}
      currentHref={current}
      footer={
        <form action={logOutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            leadingIcon={<LogOut />}
            className="-ml-1 lg:ml-0"
          >
            {LOG_OUT_LABEL}
          </Button>
        </form>
      }
    />
  );
}
