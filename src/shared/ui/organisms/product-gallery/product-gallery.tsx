"use client";

import Image, { type ImageProps } from "next/image";
import { type ComponentProps, useState } from "react";
import { cn } from "@/shared/lib/cn";

export type GalleryImage = {
  src: ImageProps["src"];
  alt: string;
  width: number;
  height: number;
};

export type ProductGalleryProps = Omit<ComponentProps<"div">, "children"> & {
  /** At least one image; the first is shown first. */
  images: readonly GalleryImage[];
};

// Half the page from `lg` (two-column product page), full width below.
const MAIN_SIZES = "(min-width: 1024px) 50vw, 100vw";

/**
 * The product page gallery: the main image over the warm amber glow
 * (concentric corners: rounded-lg frame, p-2, rounded-md well) and, with more
 * than one image, a row of thumbnail buttons (`aria-pressed`) that switch it.
 * Without JavaScript the first image shows. Throws a RangeError without images.
 */
export function ProductGallery({
  images,
  className,
  ...props
}: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  if (images.length === 0) {
    throw new RangeError("ProductGallery needs at least one image");
  }
  // A shorter list (new props) falls back to the last image.
  const main = images[Math.min(selected, images.length - 1)];

  return (
    <div {...props} className={cn("flex flex-col gap-3", className)}>
      <div className="rounded-lg border bg-card p-2">
        <div
          data-slot="media"
          className="relative aspect-square overflow-hidden rounded-md bg-background"
        >
          <div
            data-slot="glow"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-radial-[closest-side] from-primary/35 to-transparent opacity-70"
          />
          <Image
            src={main.src}
            alt={main.alt}
            width={main.width}
            height={main.height}
            sizes={MAIN_SIZES}
            preload
            className="relative size-full object-contain p-10 sm:p-16"
          />
        </div>
      </div>

      {images.length > 1 ? (
        <ul className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list where the position is the identity (two images may share a src).
            <li key={index}>
              <button
                type="button"
                aria-pressed={index === selected}
                onClick={() => setSelected(index)}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-md border bg-background p-1",
                  "transition-[border-color,box-shadow] duration-(--duration-fast) ease-out",
                  "hover:border-input aria-pressed:border-primary aria-pressed:shadow-glow",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                )}
              >
                <Image
                  src={image.src}
                  alt=""
                  width={image.width}
                  height={image.height}
                  sizes="64px"
                  className="size-full object-contain"
                />
                <span className="sr-only">
                  Ver imagen {index + 1} de {images.length}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
