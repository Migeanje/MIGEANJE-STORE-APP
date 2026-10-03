import { BookOpenText } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { Text } from "@/shared/ui/atoms/text";

export type SiteFooterCategory = {
  slug: string;
  name: string;
};

export type SiteFooterProps = Omit<ComponentProps<"footer">, "children"> & {
  /** Listed under "Tienda", in display order. Each links to /categorias/[slug]. */
  categories: readonly SiteFooterCategory[];
};

type FooterLink = { href: string; label: string };

const HELP_LINKS: readonly FooterLink[] = [
  { href: "/envios-y-devoluciones", label: "Envíos y devoluciones" },
  { href: "/garantias", label: "Garantías" },
  { href: "/pedidos/seguimiento", label: "Seguimiento de pedido" },
];

const ABOUT_LINKS: readonly FooterLink[] = [
  { href: "/como-elegimos", label: "Cómo elegimos" },
  { href: "/terminos", label: "Términos" },
  { href: "/privacidad", label: "Privacidad" },
];

function FooterColumn({
  id,
  title,
  links,
}: {
  id: string;
  title: string;
  links: readonly FooterLink[];
}) {
  const headingId = `site-footer-${id}`;
  return (
    <nav aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-body-sm font-medium text-foreground">
        {title}
      </h2>
      <ul className="flex flex-col">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="inline-flex min-h-9 items-center text-body-sm text-muted-foreground transition-colors duration-(--duration-fast) ease-out hover:text-foreground"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Site footer: brand line, the always-visible Libro de Reclamaciones link
 * (required by Peruvian consumer law), link columns ("Tienda" with the
 * categories, "Ayuda", "Nosotros"), and the legal and payment lines. Text
 * only: no third-party logos.
 */
export function SiteFooter({
  categories,
  className,
  ...props
}: SiteFooterProps) {
  const categoryLinks = categories.map(({ slug, name }) => ({
    href: `/categorias/${slug}`,
    label: name,
  }));

  return (
    <footer
      {...props}
      className={cn("border-t border-border bg-card", className)}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-3 sm:px-8 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="flex flex-col items-start gap-4 sm:col-span-3 lg:col-span-1">
          <p className="font-sans text-body font-medium text-foreground">
            Migeanje Store
          </p>
          <Text size="body-sm" tone="muted" className="max-w-xs">
            Accesorios tecnológicos premium, elegidos para que tu equipo rinda
            al máximo.
          </Text>
          <Link
            href="/libro-de-reclamaciones"
            className={cn(
              "inline-flex min-h-11 items-center gap-3 rounded-md border border-input bg-surface-raised px-4",
              "text-body-sm font-medium text-foreground",
              "transition-[border-color,box-shadow] duration-(--duration-fast) ease-out hover:border-primary hover:shadow-glow",
            )}
          >
            <BookOpenText aria-hidden="true" className="size-5 text-primary" />
            Libro de Reclamaciones
          </Link>
        </div>
        <FooterColumn id="tienda" title="Tienda" links={categoryLinks} />
        <FooterColumn id="ayuda" title="Ayuda" links={HELP_LINKS} />
        <FooterColumn id="nosotros" title="Nosotros" links={ABOUT_LINKS} />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 sm:flex-row sm:justify-between sm:px-8">
          <Text size="body-sm" tone="muted">
            © 2026 Migeanje Store · RUC por definir
          </Text>
          <Text size="body-sm" tone="muted">
            Paga con tarjeta mediante Culqi
          </Text>
        </div>
      </div>
    </footer>
  );
}
