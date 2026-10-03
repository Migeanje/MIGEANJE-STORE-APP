import { User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/button";

export type AccountLinkProps = {
  /** The account page, e.g. "/cuenta". */
  href: string;
  /** First name of the signed-in customer; omit (or null) for a guest. */
  firstName?: string | null;
  className?: string;
};

/**
 * The header account control: a person icon named "Mi cuenta" for guests.
 * For a signed-in customer it adds the first name ("Mi cuenta, Lucía"),
 * visible from `sm` (truncated when long) and always in the accessible name.
 */
export function AccountLink({ href, firstName, className }: AccountLinkProps) {
  const name = firstName?.trim() ?? "";

  if (name === "") {
    return (
      <Button
        asChild
        variant="ghost"
        className={cn("size-11 px-0", className)}
        leadingIcon={<User />}
      >
        <Link href={href}>
          <span className="sr-only">Mi cuenta</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant="ghost"
      className={cn("h-11 min-w-11 px-0 sm:px-3", className)}
      leadingIcon={<User />}
    >
      <Link href={href}>
        <span className="sr-only">Mi cuenta, {name}</span>
        <span aria-hidden="true" className="hidden max-w-32 truncate sm:inline">
          {name}
        </span>
      </Link>
    </Button>
  );
}
