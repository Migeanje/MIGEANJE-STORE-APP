import type { FilterGroup } from "../filter-panel";

// The filters of the chargers category, Anker and "Pantalla" selected.
export const CHARGER_FILTERS: readonly FilterGroup[] = [
  {
    kind: "checkboxes",
    legend: "Marca",
    options: [
      {
        name: "marca",
        value: "anker",
        label: "Anker",
        count: 3,
        checked: true,
      },
      {
        name: "marca",
        value: "ugreen",
        label: "UGREEN",
        count: 1,
        checked: false,
      },
    ],
  },
  {
    kind: "checkboxes",
    legend: "Disponibilidad",
    options: [
      {
        name: "disponibilidad",
        value: "en-stock",
        label: "En stock",
        count: 2,
        checked: false,
      },
      {
        name: "disponibilidad",
        value: "en-importacion",
        label: "En importación",
        count: 2,
        checked: false,
      },
    ],
  },
  {
    kind: "range",
    legend: "Potencia máxima",
    unit: "W",
    min: 45,
    max: 160,
    from: { name: "potencia-desde" },
    to: { name: "potencia-hasta", value: 100 },
  },
  {
    kind: "checkboxes",
    legend: "Características",
    options: [
      {
        name: "pantalla",
        value: "si",
        label: "Pantalla",
        count: 2,
        checked: true,
      },
    ],
  },
];
