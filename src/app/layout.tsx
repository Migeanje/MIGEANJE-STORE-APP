import type { Metadata } from "next";
import { CartHeaderButton } from "@/modules/cart/ui/cart-header-button";
import { CartRoot } from "@/modules/cart/ui/cart-root";
import { CategoryShortcutsContainer } from "@/modules/catalog/ui/category-shortcuts.container";
import { SiteFooterContainer } from "@/modules/catalog/ui/site-footer.container";
import { SiteHeaderContainer } from "@/modules/catalog/ui/site-header.container";
import { geistMono, geistSans } from "@/shared/ui/tokens/fonts";
import "./globals.css";

export const metadata: Metadata = {
  // Pages set their own title ("Cargadores"); the template adds the store.
  title: { default: "Migeanje Store", template: "%s · Migeanje Store" },
  description:
    "Accesorios tecnológicos premium en Perú, elegidos para que tu equipo rinda al máximo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-PE"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="flex min-h-dvh flex-col antialiased">
        {/* Reads the cart cookie: every page renders per request. */}
        <CartRoot
          emptyState={
            <CategoryShortcutsContainer headingId="carrito-categorias" />
          }
        >
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:h-11 focus:items-center focus:rounded-pill focus:bg-primary focus:px-6 focus:font-medium focus:text-primary-foreground"
          >
            Saltar al contenido
          </a>
          <SiteHeaderContainer cart={<CartHeaderButton />} />
          {/* tabIndex -1: the skip link moves focus here in every browser. */}
          <main
            id="contenido"
            tabIndex={-1}
            className="flex flex-1 flex-col outline-none"
          >
            {children}
          </main>
          <SiteFooterContainer />
        </CartRoot>
      </body>
    </html>
  );
}
