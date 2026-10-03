"use client";

import { Menu, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/button";
import {
  SearchBar,
  type SearchBarProps,
} from "@/shared/ui/molecules/search-bar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/primitives/sheet";

export type SiteHeaderCategory = {
  slug: string;
  name: string;
};

export type SiteHeaderProps = {
  /** Primary navigation, in display order. Each links to /categorias/[slug]. */
  categories: readonly SiteHeaderCategory[];
  /** Items in the cart: a non-negative integer. Defaults to 0. */
  cartCount?: number;
};

const SEARCH_PATH = "/buscar";
const MAX_BADGE_COUNT = 99;

function categoryHref(slug: string): string {
  return `/categorias/${slug}`;
}

function cartLabel(count: number): string {
  return `Carrito, ${count} ${count === 1 ? "producto" : "productos"}`;
}

/** The current page's link gets `aria-current="page"`. */
function currentProps(href: string, pathname: string) {
  return href === pathname ? ({ "aria-current": "page" } as const) : {};
}

type HeaderSearchBarProps = Omit<
  SearchBarProps,
  "value" | "defaultValue" | "onValueChange"
>;

/**
 * The search bar following the URL: on /buscar it shows the current `?q=`,
 * elsewhere it is empty. What you type stays until the URL changes.
 */
function UrlSearchBar(props: HeaderSearchBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery =
    pathname === SEARCH_PATH ? (searchParams.get("q") ?? "") : "";
  const [draft, setDraft] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  // Adjusting state while rendering (not in an effect) avoids a stale frame.
  if (syncedQuery !== urlQuery) {
    setSyncedQuery(urlQuery);
    setDraft(urlQuery);
  }
  return <SearchBar {...props} value={draft} onValueChange={setDraft} />;
}

/**
 * `useSearchParams` makes static pages render the bar on the client: the
 * Suspense fallback is the same native form, empty, so the header is complete
 * in the server HTML and search works before hydration.
 */
function HeaderSearchBar(props: HeaderSearchBarProps) {
  return (
    <Suspense fallback={<SearchBar {...props} />}>
      <UrlSearchBar {...props} />
    </Suspense>
  );
}

/**
 * Sticky site header: wordmark, product search, account and cart links and the
 * category navigation. Below `lg` the navigation and search move into a menu
 * sheet (focus trap, Escape returns focus to the menu button). The search is a
 * native GET form to /buscar, so it works before hydration; once hydrated it
 * navigates on the client and shows the current `?q=` on /buscar. The current
 * page and query are read from the router.
 */
export function SiteHeader({ categories, cartCount = 0 }: SiteHeaderProps) {
  if (!Number.isSafeInteger(cartCount) || cartCount < 0) {
    throw new RangeError(
      `cartCount must be a non-negative integer, got ${cartCount}`,
    );
  }
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function search(query: string) {
    setMenuOpen(false);
    router.push(`${SEARCH_PATH}?${new URLSearchParams({ q: query })}`);
  }

  const searchFormProps = {
    action: SEARCH_PATH,
    method: "get",
    onSearch: search,
  } as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-8 lg:gap-8">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="-ml-2 size-11 px-0 lg:hidden"
              leadingIcon={<Menu />}
            >
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            closeLabel="Cerrar menú"
            aria-describedby={undefined}
          >
            <SheetHeader>
              <SheetTitle>Menú</SheetTitle>
            </SheetHeader>
            {/* Shorter placeholder: the sheet is narrow. */}
            <HeaderSearchBar
              {...searchFormProps}
              placeholder="Busca un producto…"
            />
            <nav aria-label="Categorías">
              <ul className="flex flex-col gap-1">
                {categories.map(({ slug, name }) => (
                  <li key={slug}>
                    <Link
                      href={categoryHref(slug)}
                      {...currentProps(categoryHref(slug), pathname)}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex min-h-11 items-center rounded-md px-3 text-body text-foreground",
                        "transition-colors duration-(--duration-fast) ease-out hover:bg-accent",
                        // "Encendido": the current page is lit in amber.
                        "aria-[current=page]:text-primary",
                      )}
                    >
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>

        <Link
          href="/"
          {...currentProps("/", pathname)}
          className="inline-flex min-h-11 shrink-0 items-center font-sans text-body font-medium text-foreground"
        >
          Migeanje Store
        </Link>

        <HeaderSearchBar
          {...searchFormProps}
          className="hidden max-w-xl flex-1 lg:flex"
        />

        <div className="ml-auto flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            className="size-11 px-0"
            leadingIcon={<User />}
          >
            <Link href="/cuenta">
              <span className="sr-only">Mi cuenta</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="-mr-2 size-11 px-0"
            leadingIcon={<ShoppingBag />}
            trailingIcon={
              cartCount > 0 ? (
                <span
                  data-testid="cart-count"
                  className="absolute top-0.5 right-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-primary px-1 font-mono text-caption text-primary-foreground"
                >
                  {cartCount > MAX_BADGE_COUNT
                    ? `${MAX_BADGE_COUNT}+`
                    : cartCount}
                </span>
              ) : null
            }
          >
            <Link href="/carrito">
              <span className="sr-only">{cartLabel(cartCount)}</span>
            </Link>
          </Button>
        </div>
      </div>

      <nav
        aria-label="Categorías"
        className="hidden border-t border-border lg:block"
      >
        <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-8">
          {categories.map(({ slug, name }) => (
            <li key={slug} className="shrink-0">
              <Link
                href={categoryHref(slug)}
                {...currentProps(categoryHref(slug), pathname)}
                className={cn(
                  "relative inline-flex min-h-11 items-center px-3 text-body-sm text-muted-foreground",
                  "transition-colors duration-(--duration-fast) ease-out hover:text-foreground",
                  // "Encendido": an amber bar with a soft glow under the current page.
                  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-pill after:bg-primary after:opacity-0 after:shadow-glow",
                  "aria-[current=page]:text-foreground aria-[current=page]:after:opacity-100",
                )}
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
