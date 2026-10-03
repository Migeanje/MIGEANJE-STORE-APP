// The criteria our expert reviews score, per category, as /como-elegimos
// lists them. DRAFT copy.

/**
 * Every criterion used in the catalog's expert reviews appears here: a test
 * checks it against the catalog fixtures, so a new criterion fails CI until
 * the page explains it.
 */
export const RUBRIC_CRITERIA: readonly {
  category: string;
  criteria: readonly string[];
}[] = [
  {
    category: "Cargadores",
    criteria: [
      "Potencia",
      "Uso con varios equipos",
      "Portabilidad",
      "Relación precio-calidad",
    ],
  },
  {
    category: "Power banks",
    criteria: [
      "Potencia",
      "Capacidad",
      "Portabilidad",
      "Información en pantalla",
    ],
  },
  {
    category: "Hubs y docks",
    criteria: [
      "Conectividad",
      "Compatibilidad con Mac",
      "Carga a tu laptop",
      "Velocidad de datos",
    ],
  },
  {
    category: "Carga inalámbrica",
    criteria: [
      "Velocidad de carga",
      "Compatibilidad",
      "Todo incluido",
      "Portabilidad",
      "Versatilidad",
      "Relación precio-calidad",
    ],
  },
  {
    category: "Audio",
    criteria: [
      "Cancelación de ruido",
      "Calidad de sonido",
      "Batería",
      "Relación precio-calidad",
    ],
  },
  {
    category: "Almacenamiento",
    criteria: [
      "Rendimiento",
      "Velocidad",
      "Conectividad",
      "Compatibilidad",
      "Facilidad de uso",
      "Instalación",
      "Capacidad de crecer",
      "Relación precio-calidad",
    ],
  },
];
