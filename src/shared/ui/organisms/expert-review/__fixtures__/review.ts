import type { ExpertReviewContent } from "../expert-review";

// A review like the mock catalog's (Prime Charger 100W), for tests and stories.
export const SAMPLE_REVIEW: ExpertReviewContent = {
  verdict:
    "El cargador que reemplaza a todos los de tu mochila: 100 W para una laptop y puertos de sobra para el resto.",
  forWhom: [
    "Tienes una laptop USB-C de hasta 100 W y quieres un solo cargador",
    "Viajas y cargas laptop, celular y audífonos en una sola noche",
  ],
  notFor: [
    "Solo cargas un celular: un cargador de 30 a 45 W es más pequeño y barato",
  ],
  rubric: [
    {
      criterion: "Potencia",
      score: 5,
      note: "100 W por un solo puerto alcanzan para la mayoría de laptops USB-C.",
    },
    {
      criterion: "Uso con varios equipos",
      score: 4,
      note: "Tres puertos, pero el total baja a 89 W al usar más de uno.",
    },
    {
      criterion: "Portabilidad",
      score: 3,
      note: "170 g y enchufe compacto; más grande que un cargador de celular.",
    },
  ],
};
