import {
  type ComparisonErrorReason,
  MAX_COMPARED,
  type ProductComparison,
} from "@/modules/catalog/application/compare-products";
import type { AvailabilityStatus } from "@/modules/catalog/domain/availability";
import {
  type Product,
  type ProductImage,
  productAvailability,
  productPrice,
} from "@/modules/catalog/domain/product";
import { categoryPath, compareHref, productPath } from "./catalog-url";
import { availabilityLabel } from "./product-card-view";
import { formatSpecValue } from "./spec-format";

const LIST_FORMAT = new Intl.ListFormat("es", {
  style: "long",
  type: "conjunction",
});

function lowercase(text: string): string {
  return text.toLocaleLowerCase("es-PE");
}

export type ComparisonColumn = {
  slug: string;
  href: string;
  name: string;
  brand: string;
  image: ProductImage;
  price: { amount: number; compareAt?: number };
  availability: { status: AvailabilityStatus; label: string };
  /** The comparison without this product. */
  removeHref: string;
};

export type ComparisonRowView = {
  key: string;
  label: string;
  /** Formatted values with their unit, one per column; null when missing. */
  values: (string | null)[];
  differs: boolean;
};

export type ComparisonView = {
  /** "Comparar cargadores": the page's h1. */
  title: string;
  columns: ComparisonColumn[];
  rows: ComparisonRowView[];
  differencesOnly: boolean;
  /** The link that flips "show only the differences". */
  toggle: { href: string; label: string };
  /** What the rows show, announced as a status. */
  rowsLabel: string;
  categoryHref: string;
};

function specCount(count: number): string {
  return `${count} ${count === 1 ? "especificación" : "especificaciones"}`;
}

function rowsLabel(shown: number, total: number, differencesOnly: boolean) {
  if (!differencesOnly) return specCount(total);
  if (shown === 0) {
    return "Estos productos no tienen diferencias en sus especificaciones";
  }
  return `${shown} de ${specCount(total)} ${shown === 1 ? "es diferente" : "son diferentes"}`;
}

function column(product: Product, slugs: readonly string[]): ComparisonColumn {
  const price = productPrice(product);
  const availability = productAvailability(product);
  const [image] = product.images;
  if (image === undefined) {
    throw new Error(`Product "${product.slug}" has no image`);
  }
  return {
    slug: product.slug,
    href: productPath(product.slug),
    name: product.name,
    brand: product.brand.name,
    image,
    price:
      price.compareAt === undefined
        ? { amount: price.from }
        : { amount: price.from, compareAt: price.compareAt },
    availability: {
      status: availability.status,
      label: availabilityLabel(availability),
    },
    removeHref: compareHref(slugs.filter((slug) => slug !== product.slug)),
  };
}

/**
 * The comparator table: one column per product (the "desde" price and the
 * best availability, like the cards) and one row per comparable spec, all of
 * them or only those that differ.
 */
export function buildComparisonView(
  { category, products, rows }: ProductComparison,
  differencesOnly: boolean,
): ComparisonView {
  const slugs = products.map(({ slug }) => slug);
  const allRows = rows.map(({ key, label, unit, kind, values, differs }) => ({
    key,
    label,
    differs,
    values: values.map((value) => {
      if (value === null) return null;
      const text = formatSpecValue({ kind, value });
      return kind === "number" && unit !== undefined ? `${text} ${unit}` : text;
    }),
  }));
  const shownRows = differencesOnly
    ? allRows.filter((row) => row.differs)
    : allRows;

  return {
    title: `Comparar ${lowercase(category.name)}`,
    columns: products.map((product) => column(product, slugs)),
    rows: shownRows,
    differencesOnly,
    toggle: differencesOnly
      ? {
          href: compareHref(slugs),
          label: "Mostrar todas las especificaciones",
        }
      : {
          href: compareHref(slugs, { differencesOnly: true }),
          label: "Mostrar solo diferencias",
        },
    rowsLabel: rowsLabel(shownRows.length, allRows.length, differencesOnly),
    categoryHref: categoryPath(category.slug),
  };
}

export type ComparisonProblemView = {
  title: string;
  description: string;
  /** Next steps, most useful first. */
  actions: { href: string; label: string }[];
  /** Also offer every category (when there is no better next step). */
  showCategories: boolean;
};

export type ComparisonProblem = {
  reason: ComparisonErrorReason;
  /** The slugs from the URL, in order. */
  slugs: readonly string[];
  /** The products found for them, in order. */
  found: readonly Product[];
};

/** Products grouped by category, in first-seen order. */
function byCategory(products: readonly Product[]) {
  const groups = new Map<string, { name: string; slugs: string[] }>();
  for (const { slug, category } of products) {
    const group = groups.get(category.slug) ?? {
      name: category.name,
      slugs: [],
    };
    group.slugs.push(slug);
    groups.set(category.slug, group);
  }
  return [...groups].map(([slug, group]) => ({ slug, ...group }));
}

/**
 * Customer copy and next steps for a comparison that cannot be built (see
 * ProductComparisonError): the slugs come from the URL, so every reason is a
 * friendly state, never an error page.
 */
export function buildComparisonProblemView({
  reason,
  slugs,
  found,
}: ComparisonProblem): ComparisonProblemView {
  switch (reason) {
    case "count":
      if (slugs.length === 0) {
        return {
          title: "Elige qué comparar",
          description:
            "Abre un producto y toca «Comparar». Puedes comparar de 2 a 4 productos de una misma categoría.",
          actions: [],
          showCategories: true,
        };
      }
      if (slugs.length > MAX_COMPARED) {
        return {
          title: `Puedes comparar hasta ${MAX_COMPARED} productos`,
          description: "Quita alguno para ver la comparación.",
          actions: [
            {
              href: compareHref(slugs.slice(0, MAX_COMPARED)),
              label: `Comparar los primeros ${MAX_COMPARED}`,
            },
          ],
          showCategories: false,
        };
      }
      return {
        title: "Agrega otro producto para comparar",
        description:
          "Necesitas al menos 2 productos de una misma categoría para compararlos.",
        actions: found.map(({ category }) => ({
          href: categoryPath(category.slug),
          label: `Ver más ${lowercase(category.name)}`,
        })),
        showCategories: found.length === 0,
      };

    case "duplicate":
      return {
        title: "Repetiste un producto",
        description: "Cada producto puede aparecer una sola vez.",
        actions: [
          {
            href: compareHref([...new Set(slugs)]),
            label: "Comparar sin repetir",
          },
        ],
        showCategories: false,
      };

    case "not_found": {
      const groups = byCategory(found);
      const [only] = groups;
      const comparable =
        groups.length === 1 && only !== undefined && only.slugs.length >= 2;
      return {
        title: "No encontramos algunos productos",
        description:
          "Puede que el enlace esté incompleto o que ya no vendamos alguno de ellos.",
        actions: comparable
          ? [
              {
                href: compareHref(only.slugs),
                label: `Comparar los ${only.slugs.length} que sí encontramos`,
              },
            ]
          : [],
        showCategories: !comparable,
      };
    }

    case "mixed_categories": {
      const groups = byCategory(found);
      return {
        title: "Solo puedes comparar productos de una misma categoría",
        description: `Elegiste productos de ${LIST_FORMAT.format(
          groups.map(({ name }) => lowercase(name)),
        )}. Elige una categoría para compararlos.`,
        actions: groups.map(({ slug, name, slugs: groupSlugs }) =>
          groupSlugs.length >= 2
            ? {
                href: compareHref(groupSlugs.slice(0, MAX_COMPARED)),
                label: `Comparar ${Math.min(groupSlugs.length, MAX_COMPARED)} ${lowercase(name)}`,
              }
            : { href: categoryPath(slug), label: `Ver ${lowercase(name)}` },
        ),
        showCategories: false,
      };
    }

    case "category_not_found":
      return {
        title: "No pudimos armar esta comparación",
        description:
          "Es un problema de nuestro lado. Inténtalo más tarde o sigue explorando.",
        actions: [],
        showCategories: true,
      };
  }
}
