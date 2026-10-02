"use client";

import { Search, X } from "lucide-react";
import {
  type ComponentProps,
  type FormEvent,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { Label } from "@/shared/ui/atoms/label";

export type SearchBarProps = Omit<
  ComponentProps<"form">,
  "children" | "role" | "onSubmit"
> & {
  /** Called with the trimmed query on submit; never with an empty query. */
  onSearch: (query: string) => void;
  /** Initial query, e.g. the current `?q=` on a results page. */
  defaultValue?: string;
  /** Visually hidden label. Defaults to "Buscar productos". */
  label?: string;
  placeholder?: string;
};

/**
 * Product search form (`role="search"`): a labelled `type="search"` field, a
 * clear button while there is text (focus returns to the field) and a submit
 * button. Calls `onSearch` with the trimmed query; navigation is the caller's.
 */
export function SearchBar({
  onSearch,
  defaultValue = "",
  label = "Buscar productos",
  placeholder = "Busca cargadores, cables, power banks…",
  className,
  ...props
}: SearchBarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(defaultValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed === "") {
      inputRef.current?.focus();
      return;
    }
    onSearch(trimmed);
  }

  function handleClear() {
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: the form itself is the landmark; role="search" works in every browser, the <search> element needs Safari 17+.
    <form
      {...props}
      role="search"
      onSubmit={handleSubmit}
      className={cn("flex items-center gap-2", className)}
    >
      <Label htmlFor={inputId} className="sr-only">
        {label}
      </Label>
      <div className="relative min-w-0 flex-1">
        <Input
          ref={inputRef}
          id={inputId}
          type="search"
          name="q"
          autoComplete="off"
          enterKeyHint="search"
          placeholder={placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          // Room for the clear button; hide WebKit's own clear control.
          className="pr-12 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query !== "" ? (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1 right-1 size-9 px-0"
            leadingIcon={<X />}
            onClick={handleClear}
          >
            <span className="sr-only">Borrar búsqueda</span>
          </Button>
        ) : null}
      </div>
      <Button
        type="submit"
        variant="secondary"
        className="size-11 px-0"
        leadingIcon={<Search />}
      >
        <span className="sr-only">Buscar</span>
      </Button>
    </form>
  );
}
