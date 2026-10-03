import type { VariantOptionGroup } from "../variant-selector";

// Option groups for tests and stories: a color option and a MacBook-like
// configuration where some combinations do not exist.
export const COLOR_GROUP: VariantOptionGroup = {
  key: "color",
  label: "Color",
  selectedValue: "Negro",
  values: [
    {
      value: "Blanco",
      selected: false,
      href: "/productos/nano-charger?variante=ank-a121d-wht",
    },
    { value: "Negro", selected: true, href: "/productos/nano-charger" },
    {
      value: "Naranja",
      selected: false,
      unavailableLabel: "Agotado",
    },
  ],
};

export const CONFIG_GROUPS: readonly VariantOptionGroup[] = [
  {
    key: "chip",
    label: "Chip",
    selectedValue: "M5 (CPU de 10 núcleos, GPU de 8 núcleos)",
    values: [
      {
        value: "M5 (CPU de 10 núcleos, GPU de 8 núcleos)",
        selected: true,
        href: "/productos/macbook-air",
      },
      {
        value: "M5 (CPU de 10 núcleos, GPU de 10 núcleos)",
        selected: false,
        href: "/productos/macbook-air?variante=apl-g10",
      },
    ],
  },
  {
    key: "memory",
    label: "Memoria unificada",
    selectedValue: "16 GB",
    values: [
      { value: "16 GB", selected: true, href: "/productos/macbook-air" },
      {
        value: "24 GB",
        selected: false,
        unavailableLabel:
          "No disponible con chip M5 (CPU de 10 núcleos, GPU de 8 núcleos)",
      },
    ],
  },
];
