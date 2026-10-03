"use client";

import { useRouter } from "next/navigation";
import type { Category } from "@/modules/catalog/domain/category";
import {
  SortSelect,
  type SortSelectProps,
} from "@/shared/ui/molecules/sort-select";
import {
  FilterPanel,
  type FilterPanelProps,
  FilterSheet,
} from "@/shared/ui/organisms/filter-panel";
import {
  categoryHref,
  categoryPath,
  parseCategorySearchParams,
} from "./catalog-url";

/**
 * Client navigation for the category forms: the submitted fields are read
 * with the same parser as the server and pushed as the canonical URL (page 1),
 * without a full reload and keeping the scroll position.
 */
function useApplyCategoryQuery(category: Category) {
  const router = useRouter();
  return (params: URLSearchParams) => {
    const query = parseCategorySearchParams(params, category);
    router.push(categoryHref(category, query), { scroll: false });
  };
}

export type CategoryFiltersProps = Omit<
  FilterPanelProps,
  "action" | "onApply"
> & {
  category: Category;
  /** The `lg` column or the phone sheet. */
  variant: "panel" | "sheet";
};

/** The category filters (panel or sheet), enhanced with client navigation. */
export function CategoryFilters({
  category,
  variant,
  ...props
}: CategoryFiltersProps) {
  const apply = useApplyCategoryQuery(category);
  const Component = variant === "sheet" ? FilterSheet : FilterPanel;
  return (
    <Component
      {...props}
      action={categoryPath(category.slug)}
      onApply={apply}
    />
  );
}

export type CategorySortProps = Omit<SortSelectProps, "action" | "onApply"> & {
  category: Category;
};

/** The category sort menu, enhanced with client navigation. */
export function CategorySort({ category, ...props }: CategorySortProps) {
  const apply = useApplyCategoryQuery(category);
  return (
    <SortSelect
      {...props}
      action={categoryPath(category.slug)}
      onApply={apply}
    />
  );
}
