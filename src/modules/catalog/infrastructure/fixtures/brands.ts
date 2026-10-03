import type { Brand } from "@/modules/catalog/domain/brand";

// Brand names are descriptive text only: no logos in our identity.
export const BRANDS = {
  anker: { slug: "anker", name: "Anker" },
  ugreen: { slug: "ugreen", name: "UGREEN" },
  soundcore: { slug: "soundcore", name: "Soundcore" },
  apple: { slug: "apple", name: "Apple" },
} satisfies Record<string, Brand>;
